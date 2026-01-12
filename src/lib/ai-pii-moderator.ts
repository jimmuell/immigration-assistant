/**
 * AI-Enhanced PII Moderation
 *
 * Uses Claude Haiku to detect sophisticated PII obfuscation techniques
 * that bypass regex-based detection (e.g., "j i m u e l l a t g m a i l d o t c o m")
 *
 * Cost: ~$0.00003 per message (~$3 per 100,000 messages)
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// TYPES
// ============================================================================

export interface AIModeratorResult {
  hasPII: boolean;
  confidence: "high" | "medium" | "low";
  detectedTypes: string[];
  explanation: string;
  suggestedRedaction: string | null;
}

export interface ModerationDecision {
  shouldBlock: boolean;
  reason: string;
  aiResult: AIModeratorResult | null;
  regexFoundPII: boolean;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const HAIKU_MODEL = "claude-3-haiku-20240307";

const SYSTEM_PROMPT = `You are a PII (Personally Identifiable Information) detection system for a legal services platform.

Your job is to detect ANY attempt to share contact information in messages between attorneys and potential clients, including:
1. Direct contact info: phone numbers, email addresses, social media handles, URLs
2. Obfuscated contact info: spaced out ("j i m @ g m a i l . c o m"), phonetic ("at" instead of "@"), coded patterns
3. Contact solicitation: "call me", "text me at", "reach me on", "my number is"
4. Indirect contact sharing: business names that could be searched, specific office locations with addresses

IMPORTANT: Users may try to bypass detection using:
- Spaces between characters: "5 5 5 1 2 3 4 5 6 7"
- Word substitutions: "at" for @, "dot" for ., "dash" for -
- Phonetic spelling: "five five five..."
- Leetspeak: "j1m@gma1l.c0m"
- Reversed text or other encoding
- Embedding in sentences: "if you search for Jim Mueller Law you can find me"

Respond with ONLY a JSON object (no markdown, no explanation outside JSON):
{
  "hasPII": true/false,
  "confidence": "high"/"medium"/"low",
  "detectedTypes": ["email", "phone", "url", "social_handle", "contact_phrase", "obfuscated_contact"],
  "explanation": "Brief explanation of what was detected",
  "suggestedRedaction": "The message with PII replaced by [REDACTED]" or null if no PII
}`;

// ============================================================================
// AI MODERATOR
// ============================================================================

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

/**
 * Check a message for PII using Claude Haiku
 */
export async function checkMessageWithAI(
  message: string
): Promise<AIModeratorResult> {
  console.log("[AI-PII] Checking message with AI:", message.substring(0, 50));
  try {
    const client = getClient();
    console.log("[AI-PII] Client initialized, calling API...");

    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze this message for contact information or PII:\n\n"${message}"`,
        },
      ],
    });

    // Extract text content from response
    const textContent = response.content.find((block) => block.type === "text");
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text response from AI");
    }

    // Parse JSON response
    console.log("[AI-PII] Raw response:", textContent.text);
    const result = JSON.parse(textContent.text) as AIModeratorResult;
    console.log("[AI-PII] Parsed result:", result);
    return result;
  } catch (error: unknown) {
    console.error("[AI-PII] Error:", error);
    if (error && typeof error === 'object' && 'error' in error) {
      console.error("[AI-PII] Error details:", JSON.stringify((error as { error: unknown }).error, null, 2));
    }
    if (error && typeof error === 'object' && 'message' in error) {
      console.error("[AI-PII] Error message:", (error as { message: string }).message);
    }
    // On error, return safe default (no PII detected)
    // The regex layer should still catch obvious cases
    return {
      hasPII: false,
      confidence: "low",
      detectedTypes: [],
      explanation: "AI moderation unavailable, falling back to regex only",
      suggestedRedaction: null,
    };
  }
}

// ============================================================================
// SUSPICIOUS PATTERN DETECTION (for hybrid approach)
// ============================================================================

/**
 * Check if message has suspicious patterns that warrant AI review
 * This is used for the hybrid approach to reduce API calls
 */
export function hasSuspiciousPatterns(message: string): boolean {
  console.log("[AI-PII] Checking suspicious patterns for:", message.substring(0, 50));
  const suspiciousPatterns = [
    // Excessive spacing (more than 2 single chars separated by spaces)
    /(?:[a-zA-Z0-9]\s){3,}/,
    // Words that suggest contact sharing
    /\b(?:at|dot|dash|underscore)\b/gi,
    // Number words that could be phone numbers
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)\b.*\b(?:zero|one|two|three|four|five|six|seven|eight|nine)\b/gi,
    // Leetspeak-like patterns
    /[a-zA-Z]+[0-9]+[a-zA-Z]+/,
    // Parenthetical hints
    /\([^)]*(?:at|dot|email|phone|call|text)[^)]*\)/gi,
    // "search for" patterns
    /\b(?:search|google|look up|find)\s+(?:for\s+)?(?:me|my|us)\b/gi,
    // Mentioning business/firm names
    /\b(?:my|our)\s+(?:firm|office|practice|law\s*firm)\b/gi,
    // Contact solicitation
    /\b(?:reach|contact|call|text|message|email)\s+(?:me|us)\b/gi,
    // "you can find me"
    /\b(?:find|reach|contact)\s+(?:me|us)\s+(?:at|on|via|through)\b/gi,
  ];

  const hasSuspicious = suspiciousPatterns.some((pattern) => pattern.test(message));
  console.log("[AI-PII] Has suspicious patterns:", hasSuspicious);
  return hasSuspicious;
}

// ============================================================================
// HYBRID MODERATION (recommended approach)
// ============================================================================

/**
 * Hybrid PII moderation: regex first, AI for suspicious messages
 *
 * This approach:
 * 1. Runs regex detection first (fast, free)
 * 2. If regex finds nothing but message has suspicious patterns, runs AI check
 * 3. Returns combined decision
 */
export async function moderateMessage(
  message: string,
  regexFoundPII: boolean
): Promise<ModerationDecision> {
  // If regex already found PII, no need for AI
  if (regexFoundPII) {
    return {
      shouldBlock: true,
      reason: "Contact information detected by pattern matching",
      aiResult: null,
      regexFoundPII: true,
    };
  }

  // Check if message has suspicious patterns
  if (!hasSuspiciousPatterns(message)) {
    return {
      shouldBlock: false,
      reason: "No suspicious patterns detected",
      aiResult: null,
      regexFoundPII: false,
    };
  }

  // Run AI check for suspicious messages
  const aiResult = await checkMessageWithAI(message);

  return {
    shouldBlock: aiResult.hasPII && aiResult.confidence !== "low",
    reason: aiResult.hasPII
      ? `AI detected potential contact information: ${aiResult.explanation}`
      : "AI review passed",
    aiResult,
    regexFoundPII: false,
  };
}

// ============================================================================
// CONSTANTS EXPORT
// ============================================================================

export const AI_MODERATOR_CONSTANTS = {
  MODEL: HAIKU_MODEL,
  COST_PER_MESSAGE: 0.00003, // Approximate cost in USD
} as const;
