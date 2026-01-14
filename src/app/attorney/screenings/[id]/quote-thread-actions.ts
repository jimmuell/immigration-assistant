'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/role-middleware';
import { db } from '@/lib/db';
import { quoteThreads, quoteThreadMessages, quoteRequests, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import {
  sendMessage as sendThreadMessage,
  getOrCreateThread,
  getThreadWithMessages,
  markMessagesAsRead as markThreadMessagesAsRead,
  advanceToNextRound as advanceThread,
  closeThread as closeQuoteThread,
  type SendMessageParams,
  type SendMessageResult,
  type ThreadWithMessages,
} from '@/lib/quote-thread-service';

// ============================================================================
// GET THREAD DATA
// ============================================================================

export async function getQuoteThreadData(quoteRequestId: string): Promise<{
  success: boolean;
  data?: ThreadWithMessages;
  clientName?: string;
  isContactUnlocked?: boolean;
  error?: string;
}> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    // Get quote request with screening info
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Get or create thread for this quote
    const thread = await getOrCreateThread({
      quoteRequestId,
      organizationId: quote.organizationId,
    });

    // Get thread with messages
    const threadData = await getThreadWithMessages(thread.id);

    if (!threadData) {
      return { success: false, error: 'Failed to load thread' };
    }

    // Get client info (anonymized if contact not unlocked)
    const [client] = await db
      .select({
        id: users.id,
        name: users.name,
        anonymizedDisplayName: users.anonymizedDisplayName,
      })
      .from(users)
      .where(eq(users.id, quote.attorneyId)) // This should be screeningId lookup
      .limit(1);

    const clientName = quote.isContactUnlocked
      ? client?.name || 'Client'
      : client?.anonymizedDisplayName || 'Anonymous Client';

    return {
      success: true,
      data: threadData,
      clientName,
      isContactUnlocked: quote.isContactUnlocked,
    };
  } catch (error) {
    console.error('Error getting quote thread data:', error);
    return { success: false, error: 'Failed to load thread data' };
  }
}

// ============================================================================
// SEND MESSAGE
// ============================================================================

export async function sendQuoteThreadMessage(
  params: SendMessageParams & { screeningId: string }
): Promise<SendMessageResult & { piiWarning?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    const result = await sendThreadMessage(params);

    if (result.success) {
      revalidatePath(`/attorney/screenings/${params.screeningId}`);
      revalidatePath(`/screenings/${params.screeningId}`);
      revalidatePath(`/my-quotes`);
    }

    // Add user-friendly PII warning if content was scrubbed
    const piiWarning = result.piiWasScrubbed
      ? 'Your message contained contact information which was removed. Contact info is shared only after a quote is accepted.'
      : undefined;

    return { ...result, piiWarning };
  } catch (error) {
    console.error('Error sending quote thread message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}

// ============================================================================
// MARK MESSAGES AS READ
// ============================================================================

export async function markQuoteThreadMessagesAsRead(
  threadId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    await markThreadMessagesAsRead(threadId, userId);

    return { success: true };
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
}

// ============================================================================
// ADVANCE TO NEXT ROUND
// ============================================================================

export async function advanceToNextRound(
  threadId: string,
  screeningId: string
): Promise<{ success: boolean; newRound?: number; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);

    const updatedThread = await advanceThread(threadId);

    revalidatePath(`/attorney/screenings/${screeningId}`);

    return {
      success: true,
      newRound: updatedThread.clarificationRound,
    };
  } catch (error) {
    console.error('Error advancing to next round:', error);
    return { success: false, error: 'Failed to advance to next round' };
  }
}

// ============================================================================
// CLOSE THREAD
// ============================================================================

export async function closeThreadAction(
  threadId: string,
  screeningId: string,
  reason: 'quote_accepted' | 'quote_declined' | 'quote_expired' | 'manually_closed' | 'contact_unlocked'
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);

    await closeQuoteThread(threadId, reason);

    revalidatePath(`/attorney/screenings/${screeningId}`);

    return { success: true };
  } catch (error) {
    console.error('Error closing thread:', error);
    return { success: false, error: 'Failed to close thread' };
  }
}

// ============================================================================
// GET THREAD FOR SCREENING
// ============================================================================

export async function getThreadForQuote(quoteRequestId: string): Promise<{
  success: boolean;
  thread?: {
    id: string;
    state: string;
    clarificationRound: number;
    attorneyQuestionsCount: number;
    clientQuestionsCount: number;
    maxQuestionsPerRound: number;
  };
  messages?: Array<{
    id: string;
    content: string;
    senderId: string;
    senderRole: string;
    messageType: string;
    piiScrubbed: boolean;
    isRead: boolean;
    clarificationRound: number;
    createdAt: Date;
  }>;
  error?: string;
}> {
  try {
    await requireRole(['attorney', 'org_admin', 'staff', 'super_admin', 'client']);

    // Get quote
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Get or create thread
    const thread = await getOrCreateThread({
      quoteRequestId,
      organizationId: quote.organizationId,
    });

    // Get messages
    const messages = await db
      .select({
        id: quoteThreadMessages.id,
        content: quoteThreadMessages.content,
        senderId: quoteThreadMessages.senderId,
        senderRole: quoteThreadMessages.senderRole,
        messageType: quoteThreadMessages.messageType,
        piiScrubbed: quoteThreadMessages.piiScrubbed,
        isRead: quoteThreadMessages.isRead,
        clarificationRound: quoteThreadMessages.clarificationRound,
        createdAt: quoteThreadMessages.createdAt,
      })
      .from(quoteThreadMessages)
      .where(eq(quoteThreadMessages.threadId, thread.id))
      .orderBy(quoteThreadMessages.createdAt);

    return {
      success: true,
      thread: {
        id: thread.id,
        state: thread.state,
        clarificationRound: thread.clarificationRound,
        attorneyQuestionsCount: thread.attorneyQuestionsCount,
        clientQuestionsCount: thread.clientQuestionsCount,
        maxQuestionsPerRound: thread.maxQuestionsPerRound,
      },
      messages,
    };
  } catch (error) {
    console.error('Error getting thread for quote:', error);
    return { success: false, error: 'Failed to get thread' };
  }
}
