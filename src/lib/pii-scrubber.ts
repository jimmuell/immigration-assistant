/**
 * PII Scrubber Utility
 *
 * Detects and removes personally identifiable information (PII) from messages
 * to prevent off-platform contact between attorneys and clients before
 * a paid commitment exists.
 *
 * Uses a hybrid approach:
 * 1. Fast regex-based detection for obvious patterns
 * 2. AI-enhanced detection (Claude Haiku) for obfuscated patterns
 *
 * Based on the Lead Protection Architecture document.
 */

import {
  moderateMessage,
  type AIModeratorResult,
} from "./ai-pii-moderator";

// ============================================================================
// TYPES
// ============================================================================

export interface PIIMatch {
  type: PIIType;
  value: string;
  startIndex: number;
  endIndex: number;
}

export interface PIIScrubResult {
  scrubbedContent: string;
  originalContent: string;
  wasScubbed: boolean;
  matches: PIIMatch[];
  replacementMessage: string;
}

export type PIIType =
  | 'phone_number'
  | 'email_address'
  | 'url'
  | 'social_handle'
  | 'contact_phrase';

// ============================================================================
// DETECTION PATTERNS
// ============================================================================

/**
 * Regex patterns for detecting various types of PII
 */
const PII_PATTERNS: Record<PIIType, RegExp[]> = {
  // Phone numbers - various formats
  phone_number: [
    // US formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
    // International format: +1 123 456 7890, +44 20 7123 4567
    /\+\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
    // Written out numbers to avoid detection: "five five five one two three four"
    /\b(?:zero|one|two|three|four|five|six|seven|eight|nine)(?:\s+(?:zero|one|two|three|four|five|six|seven|eight|nine)){6,}/gi,
  ],

  // Email addresses
  email_address: [
    // Standard email format
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Obfuscated emails: user [at] domain [dot] com
    /[a-zA-Z0-9._%+-]+\s*[\[\(]?\s*at\s*[\]\)]?\s*[a-zA-Z0-9.-]+\s*[\[\(]?\s*dot\s*[\]\)]?\s*[a-zA-Z]{2,}/gi,
    // Spaced out emails: u s e r @ d o m a i n . c o m
    /(?:[a-zA-Z0-9]\s*){3,}@\s*(?:[a-zA-Z0-9]\s*\.?\s*){3,}/g,
  ],

  // URLs and links
  url: [
    // Standard URLs
    /https?:\/\/[^\s<>\"']+/gi,
    // URLs without protocol
    /(?:www\.)[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]\.[^\s<>\"']+/gi,
    // Domain patterns that look like websites
    /\b[a-zA-Z0-9][a-zA-Z0-9-]*\.(com|org|net|io|co|app|dev|me|info|biz|us|uk|ca)\b/gi,
  ],

  // Social media handles
  social_handle: [
    // Twitter/X handles: @username
    /@[a-zA-Z0-9_]{1,15}\b/g,
    // Instagram/social mentions
    /\b(?:instagram|ig|twitter|x|facebook|fb|linkedin|whatsapp|telegram|signal|snapchat)[\s:]*@?[a-zA-Z0-9._-]+/gi,
  ],

  // Contact solicitation phrases
  contact_phrase: [
    // Direct contact requests
    /\b(?:call|text|message|contact|reach|email|dm|pm)\s+me\b/gi,
    /\bgive\s+me\s+(?:a\s+)?(?:call|ring|text|message)\b/gi,
    /\bmy\s+(?:phone|cell|mobile|number|email|address)\s+is\b/gi,
    /\bhere(?:'s|\s+is)\s+my\s+(?:number|email|contact)\b/gi,
    /\b(?:reach|contact|get\s+in\s+touch\s+with)\s+(?:me|us)\s+(?:at|on|via)\b/gi,
    /\blet(?:'s|\s+us)\s+(?:talk|chat|speak|connect)\s+(?:off|outside|privately)\b/gi,
    /\b(?:off|outside)\s+(?:the\s+)?(?:platform|app|site|system)\b/gi,
    /\bdirect(?:ly)?\s+(?:contact|message|reach)\b/gi,
  ],
};

// ============================================================================
// REPLACEMENT MESSAGES
// ============================================================================

const REPLACEMENT_MARKER = '[REDACTED]';

const SYSTEM_WARNING = 'Contact information is shared only after a quote is accepted.';

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Detects all PII in a given text
 */
export function detectPII(text: string): PIIMatch[] {
  const matches: PIIMatch[] = [];

  for (const [type, patterns] of Object.entries(PII_PATTERNS) as [PIIType, RegExp[]][]) {
    for (const pattern of patterns) {
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const startIndex = match.index;
        const endIndex = startIndex + match[0].length;

        matches.push({
          type,
          value: match[0],
          startIndex,
          endIndex,
        });
      }
    }
  }

  // Sort by start index, then by length (longest first for overlaps)
  matches.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return a.startIndex - b.startIndex;
    }
    return b.endIndex - a.endIndex; // Longer matches first
  });

  // Merge overlapping matches to avoid double-redaction
  const mergedMatches: PIIMatch[] = [];
  for (const match of matches) {
    const last = mergedMatches[mergedMatches.length - 1];

    // If this match overlaps with the last one, skip it or extend
    if (last && match.startIndex < last.endIndex) {
      // Extend the last match if this one goes further
      if (match.endIndex > last.endIndex) {
        last.endIndex = match.endIndex;
        last.value = text.slice(last.startIndex, last.endIndex);
      }
      // Otherwise skip this overlapping match
      continue;
    }

    mergedMatches.push({ ...match });
  }

  return mergedMatches;
}

/**
 * Checks if text contains any PII
 */
export function containsPII(text: string): boolean {
  return detectPII(text).length > 0;
}

/**
 * Gets a summary of PII types found
 */
export function getPIISummary(matches: PIIMatch[]): Record<PIIType, number> {
  const summary: Record<PIIType, number> = {
    phone_number: 0,
    email_address: 0,
    url: 0,
    social_handle: 0,
    contact_phrase: 0,
  };

  for (const match of matches) {
    summary[match.type]++;
  }

  return summary;
}

// ============================================================================
// SCRUBBING FUNCTIONS
// ============================================================================

/**
 * Scrubs all PII from text, replacing with redaction markers
 */
export function scrubPII(text: string): PIIScrubResult {
  const matches = detectPII(text);

  if (matches.length === 0) {
    return {
      scrubbedContent: text,
      originalContent: text,
      wasScubbed: false,
      matches: [],
      replacementMessage: '',
    };
  }

  // Replace matches from end to start to preserve indices
  let scrubbedContent = text;
  const reversedMatches = [...matches].reverse();

  for (const match of reversedMatches) {
    scrubbedContent =
      scrubbedContent.slice(0, match.startIndex) +
      REPLACEMENT_MARKER +
      scrubbedContent.slice(match.endIndex);
  }

  return {
    scrubbedContent,
    originalContent: text,
    wasScubbed: true,
    matches,
    replacementMessage: SYSTEM_WARNING,
  };
}

/**
 * Scrubs PII and appends a system warning if PII was found
 */
export function scrubPIIWithWarning(text: string): PIIScrubResult {
  const result = scrubPII(text);

  if (result.wasScubbed) {
    result.scrubbedContent = `${result.scrubbedContent}\n\n⚠️ ${SYSTEM_WARNING}`;
  }

  return result;
}

// ============================================================================
// MESSAGE PROCESSING
// ============================================================================

export interface ProcessedMessage {
  content: string;
  originalContent: string | null;
  piiScrubbed: boolean;
  piiScrubDetails: {
    matchCount: number;
    types: PIIType[];
    summary: Record<PIIType, number>;
  } | null;
}

/**
 * Processes a message for quote thread messaging
 * Returns the scrubbed content and metadata for storage
 */
export function processMessageForQuoteThread(content: string): ProcessedMessage {
  const result = scrubPII(content);

  if (!result.wasScubbed) {
    return {
      content: content,
      originalContent: null,
      piiScrubbed: false,
      piiScrubDetails: null,
    };
  }

  const types = [...new Set(result.matches.map(m => m.type))];

  return {
    content: result.scrubbedContent,
    originalContent: result.originalContent,
    piiScrubbed: true,
    piiScrubDetails: {
      matchCount: result.matches.length,
      types,
      summary: getPIISummary(result.matches),
    },
  };
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates that a message doesn't contain PII
 * Throws an error if PII is detected (for strict enforcement)
 */
export function validateNoPII(text: string): void {
  const matches = detectPII(text);

  if (matches.length > 0) {
    const types = [...new Set(matches.map(m => m.type))].join(', ');
    throw new Error(
      `Message contains contact information (${types}). ${SYSTEM_WARNING}`
    );
  }
}

/**
 * Checks if a message is safe to send without scrubbing
 */
export function isMessageSafe(text: string): boolean {
  return !containsPII(text);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a human-readable description of what was redacted
 */
export function getRedactionDescription(matches: PIIMatch[]): string {
  if (matches.length === 0) return '';

  const summary = getPIISummary(matches);
  const parts: string[] = [];

  if (summary.phone_number > 0) {
    parts.push(`${summary.phone_number} phone number${summary.phone_number > 1 ? 's' : ''}`);
  }
  if (summary.email_address > 0) {
    parts.push(`${summary.email_address} email address${summary.email_address > 1 ? 'es' : ''}`);
  }
  if (summary.url > 0) {
    parts.push(`${summary.url} URL${summary.url > 1 ? 's' : ''}`);
  }
  if (summary.social_handle > 0) {
    parts.push(`${summary.social_handle} social media handle${summary.social_handle > 1 ? 's' : ''}`);
  }
  if (summary.contact_phrase > 0) {
    parts.push(`${summary.contact_phrase} contact phrase${summary.contact_phrase > 1 ? 's' : ''}`);
  }

  if (parts.length === 0) return '';
  if (parts.length === 1) return `Redacted: ${parts[0]}`;

  const last = parts.pop();
  return `Redacted: ${parts.join(', ')} and ${last}`;
}

// ============================================================================
// CONSTANTS EXPORT
// ============================================================================

export const PII_SCRUBBER_CONSTANTS = {
  REPLACEMENT_MARKER,
  SYSTEM_WARNING,
} as const;

// ============================================================================
// AI-ENHANCED PROCESSING
// ============================================================================

export interface AIEnhancedProcessedMessage extends ProcessedMessage {
  aiModerated: boolean;
  aiResult: AIModeratorResult | null;
}

/**
 * Process a message with AI-enhanced PII detection
 * Uses hybrid approach: regex first, then AI for suspicious messages
 *
 * This catches obfuscated contact info like:
 * - "j i m u e l l a t g m a i l d o t c o m"
 * - "five five five one two three four"
 * - "search for my firm name"
 */
export async function processMessageWithAI(
  content: string
): Promise<AIEnhancedProcessedMessage> {
  // Step 1: Run regex detection
  const regexResult = scrubPII(content);
  const regexFoundPII = regexResult.wasScubbed;

  // Step 2: Run hybrid AI moderation
  const moderationResult = await moderateMessage(content, regexFoundPII);

  // Step 3: Determine final result
  if (regexFoundPII) {
    // Regex found PII - use regex result
    const types = [...new Set(regexResult.matches.map((m) => m.type))];
    return {
      content: regexResult.scrubbedContent,
      originalContent: regexResult.originalContent,
      piiScrubbed: true,
      piiScrubDetails: {
        matchCount: regexResult.matches.length,
        types,
        summary: getPIISummary(regexResult.matches),
      },
      aiModerated: false,
      aiResult: moderationResult.aiResult,
    };
  }

  if (moderationResult.shouldBlock && moderationResult.aiResult) {
    // AI detected obfuscated PII
    const aiResult = moderationResult.aiResult;
    return {
      content: aiResult.suggestedRedaction || `${REPLACEMENT_MARKER} ${content}`,
      originalContent: content,
      piiScrubbed: true,
      piiScrubDetails: {
        matchCount: aiResult.detectedTypes.length,
        types: aiResult.detectedTypes as PIIType[],
        summary: {
          phone_number: aiResult.detectedTypes.includes("phone") ? 1 : 0,
          email_address: aiResult.detectedTypes.includes("email") ? 1 : 0,
          url: aiResult.detectedTypes.includes("url") ? 1 : 0,
          social_handle: aiResult.detectedTypes.includes("social_handle") ? 1 : 0,
          contact_phrase: aiResult.detectedTypes.includes("contact_phrase") ||
            aiResult.detectedTypes.includes("obfuscated_contact")
            ? 1
            : 0,
        },
      },
      aiModerated: true,
      aiResult,
    };
  }

  // No PII detected by either method
  return {
    content: content,
    originalContent: null,
    piiScrubbed: false,
    piiScrubDetails: null,
    aiModerated: moderationResult.aiResult !== null,
    aiResult: moderationResult.aiResult,
  };
}
