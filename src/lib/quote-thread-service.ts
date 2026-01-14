/**
 * Quote Thread Service
 *
 * Handles quote thread messaging with PII protection, rate limiting,
 * and thread state management.
 */

import { db } from '@/lib/db';
import {
  quoteThreads,
  quoteThreadMessages,
  quoteRequests,
  users,
  type QuoteThread,
  type QuoteThreadMessage,
  type NewQuoteThreadMessage,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { processMessageWithAI, type AIEnhancedProcessedMessage } from '@/lib/pii-scrubber';

// ============================================================================
// TYPES
// ============================================================================

export type MessageType = 'clarification_question' | 'clarification_response' | 'counteroffer_message' | 'general' | 'system_notification';
export type SenderRole = 'client' | 'attorney' | 'staff' | 'system';
export type ThreadState = 'open' | 'closed' | 'archived';

export interface SendMessageParams {
  threadId: string;
  senderId: string;
  senderRole: SenderRole;
  content: string;
  messageType?: MessageType;
  relatedCounterofferId?: string;
}

export interface SendMessageResult {
  success: boolean;
  message?: QuoteThreadMessage;
  error?: string;
  piiWasScrubbed?: boolean;
  aiModerated?: boolean;
  rateLimitExceeded?: boolean;
}

export interface CreateThreadParams {
  quoteRequestId: string;
  organizationId: string;
  maxQuestionsPerRound?: number;
}

export interface ThreadWithMessages {
  thread: QuoteThread;
  messages: QuoteThreadMessage[];
  canSendMessage: boolean;
  rateLimitInfo: {
    attorneyQuestionsRemaining: number;
    clientQuestionsRemaining: number;
    currentRound: number;
  };
}

// ============================================================================
// THREAD MANAGEMENT
// ============================================================================

/**
 * Creates a new quote thread for a quote request
 */
export async function createQuoteThread(params: CreateThreadParams): Promise<QuoteThread> {
  const { quoteRequestId, organizationId, maxQuestionsPerRound = 3 } = params;

  const [thread] = await db
    .insert(quoteThreads)
    .values({
      quoteRequestId,
      organizationId,
      state: 'open',
      clarificationRound: 1,
      attorneyQuestionsCount: 0,
      clientQuestionsCount: 0,
      maxQuestionsPerRound,
    })
    .returning();

  return thread;
}

/**
 * Gets or creates a thread for a quote request
 */
export async function getOrCreateThread(params: CreateThreadParams): Promise<QuoteThread> {
  // Check for existing thread
  const existing = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.quoteRequestId, params.quoteRequestId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  return createQuoteThread(params);
}

/**
 * Gets a thread by ID with all messages
 */
export async function getThreadWithMessages(threadId: string): Promise<ThreadWithMessages | null> {
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.id, threadId))
    .limit(1);

  if (!thread) {
    return null;
  }

  const messages = await db
    .select()
    .from(quoteThreadMessages)
    .where(eq(quoteThreadMessages.threadId, threadId))
    .orderBy(quoteThreadMessages.createdAt);

  const attorneyQuestionsRemaining = thread.maxQuestionsPerRound - thread.attorneyQuestionsCount;
  const clientQuestionsRemaining = thread.maxQuestionsPerRound - thread.clientQuestionsCount;

  return {
    thread,
    messages,
    canSendMessage: thread.state === 'open',
    rateLimitInfo: {
      attorneyQuestionsRemaining: Math.max(0, attorneyQuestionsRemaining),
      clientQuestionsRemaining: Math.max(0, clientQuestionsRemaining),
      currentRound: thread.clarificationRound,
    },
  };
}

/**
 * Gets a thread by quote request ID
 */
export async function getThreadByQuoteRequest(quoteRequestId: string): Promise<QuoteThread | null> {
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.quoteRequestId, quoteRequestId))
    .limit(1);

  return thread || null;
}

/**
 * Closes a thread with a reason
 */
export async function closeThread(
  threadId: string,
  reason: 'quote_accepted' | 'quote_declined' | 'quote_expired' | 'manually_closed' | 'contact_unlocked'
): Promise<QuoteThread> {
  const [thread] = await db
    .update(quoteThreads)
    .set({
      state: 'closed',
      closedAt: new Date(),
      closedReason: reason,
      updatedAt: new Date(),
    })
    .where(eq(quoteThreads.id, threadId))
    .returning();

  return thread;
}

/**
 * Advances the thread to the next clarification round
 * Resets question counts for both parties
 */
export async function advanceToNextRound(threadId: string): Promise<QuoteThread> {
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.id, threadId))
    .limit(1);

  if (!thread) {
    throw new Error('Thread not found');
  }

  const [updated] = await db
    .update(quoteThreads)
    .set({
      clarificationRound: thread.clarificationRound + 1,
      attorneyQuestionsCount: 0,
      clientQuestionsCount: 0,
      updatedAt: new Date(),
    })
    .where(eq(quoteThreads.id, threadId))
    .returning();

  return updated;
}

// ============================================================================
// MESSAGE SENDING
// ============================================================================

/**
 * Sends a message in a quote thread with PII scrubbing and rate limiting
 */
export async function sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
  const { threadId, senderId, senderRole, content, messageType = 'general', relatedCounterofferId } = params;

  // Get thread
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.id, threadId))
    .limit(1);

  if (!thread) {
    return { success: false, error: 'Thread not found' };
  }

  // Check if thread is open
  if (thread.state !== 'open') {
    return { success: false, error: 'Thread is closed' };
  }

  // Check rate limits for clarification questions
  if (messageType === 'clarification_question') {
    if (senderRole === 'attorney' && thread.attorneyQuestionsCount >= thread.maxQuestionsPerRound) {
      return {
        success: false,
        error: `You have reached the limit of ${thread.maxQuestionsPerRound} clarification questions for this round.`,
        rateLimitExceeded: true,
      };
    }
    if (senderRole === 'client' && thread.clientQuestionsCount >= thread.maxQuestionsPerRound) {
      return {
        success: false,
        error: `You have reached the limit of ${thread.maxQuestionsPerRound} clarification questions for this round.`,
        rateLimitExceeded: true,
      };
    }
  }

  // Process message for PII with AI-enhanced detection
  const processed: AIEnhancedProcessedMessage = await processMessageWithAI(content);

  // Create message
  const [message] = await db
    .insert(quoteThreadMessages)
    .values({
      threadId,
      senderId,
      senderRole,
      messageType,
      content: processed.content,
      originalContent: processed.originalContent,
      piiScrubbed: processed.piiScrubbed,
      piiScrubDetails: processed.piiScrubDetails,
      relatedCounterofferId,
      clarificationRound: thread.clarificationRound,
    })
    .returning();

  // Update question counts if this was a clarification question
  if (messageType === 'clarification_question') {
    if (senderRole === 'attorney') {
      await db
        .update(quoteThreads)
        .set({
          attorneyQuestionsCount: thread.attorneyQuestionsCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(quoteThreads.id, threadId));
    } else if (senderRole === 'client') {
      await db
        .update(quoteThreads)
        .set({
          clientQuestionsCount: thread.clientQuestionsCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(quoteThreads.id, threadId));
    }
  }

  return {
    success: true,
    message,
    piiWasScrubbed: processed.piiScrubbed,
    aiModerated: processed.aiModerated,
  };
}

/**
 * Sends a system notification message (no PII scrubbing, no rate limits)
 * @param threadId - The thread to send the message to
 * @param content - The message content
 * @param senderId - Optional sender ID (uses first admin user if not provided)
 */
export async function sendSystemMessage(
  threadId: string,
  content: string,
  senderId?: string
): Promise<QuoteThreadMessage> {
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.id, threadId))
    .limit(1);

  if (!thread) {
    throw new Error('Thread not found');
  }

  // If no senderId provided, try to find any admin user to use as sender
  let actualSenderId = senderId;
  if (!actualSenderId) {
    const [adminUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, 'super_admin'))
      .limit(1);
    actualSenderId = adminUser?.id;
  }

  // If still no sender, fall back to finding any user (shouldn't happen in production)
  if (!actualSenderId) {
    const [anyUser] = await db
      .select({ id: users.id })
      .from(users)
      .limit(1);
    actualSenderId = anyUser?.id;
  }

  if (!actualSenderId) {
    throw new Error('No valid sender found for system message');
  }

  const [message] = await db
    .insert(quoteThreadMessages)
    .values({
      threadId,
      senderId: actualSenderId,
      senderRole: 'system',
      messageType: 'system_notification',
      content,
      piiScrubbed: false,
      clarificationRound: thread.clarificationRound,
    })
    .returning();

  return message;
}

// ============================================================================
// MESSAGE READING
// ============================================================================

/**
 * Gets messages for a thread
 */
export async function getMessages(threadId: string): Promise<QuoteThreadMessage[]> {
  return db
    .select()
    .from(quoteThreadMessages)
    .where(eq(quoteThreadMessages.threadId, threadId))
    .orderBy(quoteThreadMessages.createdAt);
}

/**
 * Gets unread message count for a user in a thread
 */
export async function getUnreadCount(threadId: string, userId: string): Promise<number> {
  const messages = await db
    .select()
    .from(quoteThreadMessages)
    .where(
      and(
        eq(quoteThreadMessages.threadId, threadId),
        eq(quoteThreadMessages.isRead, false)
      )
    );

  // Count messages not sent by this user
  return messages.filter(m => m.senderId !== userId).length;
}

/**
 * Marks all messages in a thread as read for a user
 */
export async function markMessagesAsRead(threadId: string, userId: string): Promise<void> {
  // Get all unread messages not sent by this user
  const unreadMessages = await db
    .select()
    .from(quoteThreadMessages)
    .where(
      and(
        eq(quoteThreadMessages.threadId, threadId),
        eq(quoteThreadMessages.isRead, false)
      )
    );

  // Update only messages not sent by this user
  for (const message of unreadMessages) {
    if (message.senderId !== userId) {
      await db
        .update(quoteThreadMessages)
        .set({ isRead: true })
        .where(eq(quoteThreadMessages.id, message.id));
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the display name for a user in a thread context
 * Returns anonymized name if contact is not unlocked
 */
export async function getDisplayNameForThread(
  userId: string,
  quoteRequestId: string
): Promise<string> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    return 'Unknown User';
  }

  // If user is a client, check if contact is unlocked
  if (user.role === 'client') {
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    // If contact is not unlocked, return anonymized name
    if (!quote?.isContactUnlocked) {
      return user.anonymizedDisplayName || `Client #${user.id.substring(0, 4).toUpperCase()}`;
    }
  }

  // Return actual name
  return user.name || user.email;
}

/**
 * Checks if a user can send messages in a thread
 */
export async function canUserSendMessage(
  threadId: string,
  userId: string,
  userRole: SenderRole
): Promise<{ canSend: boolean; reason?: string }> {
  const [thread] = await db
    .select()
    .from(quoteThreads)
    .where(eq(quoteThreads.id, threadId))
    .limit(1);

  if (!thread) {
    return { canSend: false, reason: 'Thread not found' };
  }

  if (thread.state !== 'open') {
    return { canSend: false, reason: 'Thread is closed' };
  }

  // Staff and system can always send
  if (userRole === 'staff' || userRole === 'system') {
    return { canSend: true };
  }

  return { canSend: true };
}
