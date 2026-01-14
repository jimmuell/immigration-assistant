/**
 * Counteroffer Service
 *
 * Handles counteroffer/negotiation operations for the quote system.
 * Integrates with quote threads to post system messages on actions.
 */

import { db } from '@/lib/db';
import {
  quoteCounterOffers,
  quoteRequests,
  quoteThreads,
  users,
  notificationStates,
  screenings,
  type QuoteCounterOffer,
  type NewQuoteCounterOffer,
} from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sendSystemMessage, getThreadByQuoteRequest } from './quote-thread-service';

// ============================================================================
// TYPES
// ============================================================================

export type CounterOfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'superseded';
export type InitiatorRole = 'client' | 'attorney';

export interface ProposedLineItem {
  description: string;
  amount: number;
  quantity?: number;
  feeType: 'flat_fee' | 'hourly' | 'government_fee' | 'filing_fee' | 'consultation' | 'retainer' | 'other';
}

export interface CreateCounterOfferParams {
  quoteRequestId: string;
  initiatorId: string;
  initiatorRole: InitiatorRole;
  proposedAmount?: number;
  proposedLineItems?: ProposedLineItem[];
  scopeChanges?: string;
  scopeAdditions?: string[];
  scopeRemovals?: string[];
  reason?: string;
  expiresAt?: Date;
}

export interface RespondToCounterOfferParams {
  counterOfferId: string;
  responderId: string;
  action: 'accept' | 'reject';
  responseNote?: string;
}

export interface CounterOfferWithDetails {
  id: string;
  quoteRequestId: string;
  threadId: string | null;
  initiatorId: string;
  initiatorRole: 'client' | 'attorney';
  proposedAmount: number | null;
  proposedLineItems: unknown;
  scopeChanges: string | null;
  scopeAdditions: string[] | null;
  scopeRemovals: string[] | null;
  reason: string | null;
  negotiationRound: number;
  expiresAt: Date | null;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired' | 'superseded';
  respondedAt: Date | null;
  respondedBy: string | null;
  responseNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  initiatorName: string | null;
  initiatorEmail: string | null;
}

export interface CounterOfferResult {
  success: boolean;
  counterOffer?: QuoteCounterOffer;
  error?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// COUNTEROFFER OPERATIONS
// ============================================================================

/**
 * Creates a new counteroffer for a quote request
 * - Supersedes any existing pending counteroffers
 * - Increments negotiation round count on quote request
 * - Posts system message to thread if thread exists
 */
export async function createCounterOffer(
  params: CreateCounterOfferParams
): Promise<CounterOfferResult> {
  const {
    quoteRequestId,
    initiatorId,
    initiatorRole,
    proposedAmount,
    proposedLineItems,
    scopeChanges,
    scopeAdditions,
    scopeRemovals,
    reason,
    expiresAt,
  } = params;

  try {
    // Validate quote exists and is in valid status
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'pending') {
      return { success: false, error: 'Cannot create counteroffer for a non-pending quote' };
    }

    // Mark any existing pending counteroffers as superseded
    await db
      .update(quoteCounterOffers)
      .set({
        status: 'superseded',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quoteCounterOffers.quoteRequestId, quoteRequestId),
          eq(quoteCounterOffers.status, 'pending')
        )
      );

    // Calculate negotiation round
    const negotiationRound = (quote.negotiationRoundCount || 0) + 1;

    // Get thread ID if exists
    const thread = await getThreadByQuoteRequest(quoteRequestId);

    // Create the counteroffer
    const [counterOffer] = await db
      .insert(quoteCounterOffers)
      .values({
        quoteRequestId,
        threadId: thread?.id,
        initiatorId,
        initiatorRole,
        proposedAmount,
        proposedLineItems: proposedLineItems || null,
        scopeChanges,
        scopeAdditions,
        scopeRemovals,
        reason,
        negotiationRound,
        expiresAt,
        status: 'pending',
      })
      .returning();

    // Update quote request with current counteroffer and round count
    await db
      .update(quoteRequests)
      .set({
        currentCounterofferId: counterOffer.id,
        negotiationRoundCount: negotiationRound,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, quoteRequestId));

    // Post system message to thread
    if (thread) {
      const roleLabel = initiatorRole === 'attorney' ? 'Attorney' : 'Client';
      const amountText = proposedAmount
        ? ` of $${proposedAmount.toLocaleString()}`
        : '';
      await sendSystemMessage(
        thread.id,
        `${roleLabel} has proposed a counteroffer${amountText}. Round ${negotiationRound} of negotiation.`
      );
    }

    return { success: true, counterOffer };
  } catch (error) {
    console.error('Error creating counteroffer:', error);
    return { success: false, error: 'Failed to create counteroffer' };
  }
}

/**
 * Retrieves all counteroffers for a quote request, ordered by creation date (newest first)
 */
export async function getCounterOffersForQuote(
  quoteRequestId: string
): Promise<QuoteCounterOffer[]> {
  return db
    .select()
    .from(quoteCounterOffers)
    .where(eq(quoteCounterOffers.quoteRequestId, quoteRequestId))
    .orderBy(desc(quoteCounterOffers.createdAt));
}

/**
 * Gets the currently active (pending) counteroffer for a quote request
 */
export async function getActiveCounterOffer(
  quoteRequestId: string
): Promise<QuoteCounterOffer | null> {
  const [counterOffer] = await db
    .select()
    .from(quoteCounterOffers)
    .where(
      and(
        eq(quoteCounterOffers.quoteRequestId, quoteRequestId),
        eq(quoteCounterOffers.status, 'pending')
      )
    )
    .orderBy(desc(quoteCounterOffers.createdAt))
    .limit(1);

  return counterOffer || null;
}

/**
 * Gets counteroffer history with user details for display
 */
export async function getCounterOfferHistory(
  quoteRequestId: string
): Promise<CounterOfferWithDetails[]> {
  const counterOffers = await db
    .select({
      id: quoteCounterOffers.id,
      quoteRequestId: quoteCounterOffers.quoteRequestId,
      threadId: quoteCounterOffers.threadId,
      initiatorId: quoteCounterOffers.initiatorId,
      initiatorRole: quoteCounterOffers.initiatorRole,
      proposedAmount: quoteCounterOffers.proposedAmount,
      proposedLineItems: quoteCounterOffers.proposedLineItems,
      scopeChanges: quoteCounterOffers.scopeChanges,
      scopeAdditions: quoteCounterOffers.scopeAdditions,
      scopeRemovals: quoteCounterOffers.scopeRemovals,
      reason: quoteCounterOffers.reason,
      negotiationRound: quoteCounterOffers.negotiationRound,
      expiresAt: quoteCounterOffers.expiresAt,
      status: quoteCounterOffers.status,
      respondedAt: quoteCounterOffers.respondedAt,
      respondedBy: quoteCounterOffers.respondedBy,
      responseNote: quoteCounterOffers.responseNote,
      createdAt: quoteCounterOffers.createdAt,
      updatedAt: quoteCounterOffers.updatedAt,
      initiatorName: users.name,
      initiatorEmail: users.email,
    })
    .from(quoteCounterOffers)
    .leftJoin(users, eq(users.id, quoteCounterOffers.initiatorId))
    .where(eq(quoteCounterOffers.quoteRequestId, quoteRequestId))
    .orderBy(desc(quoteCounterOffers.createdAt));

  return counterOffers;
}

/**
 * Responds to a counteroffer (accept or reject)
 * - Accept: Updates quote with new amount, closes negotiation
 * - Reject: Allows new counteroffers to be created
 */
export async function respondToCounterOffer(
  params: RespondToCounterOfferParams
): Promise<ActionResult> {
  const { counterOfferId, responderId, action, responseNote } = params;

  try {
    // Get the counteroffer
    const [counterOffer] = await db
      .select()
      .from(quoteCounterOffers)
      .where(eq(quoteCounterOffers.id, counterOfferId))
      .limit(1);

    if (!counterOffer) {
      return { success: false, error: 'Counteroffer not found' };
    }

    if (counterOffer.status !== 'pending') {
      return { success: false, error: 'Counteroffer is no longer pending' };
    }

    // Get responder info to validate they're the opposite party
    const [responder] = await db
      .select()
      .from(users)
      .where(eq(users.id, responderId))
      .limit(1);

    if (!responder) {
      return { success: false, error: 'Responder not found' };
    }

    // Validate responder is the opposite party
    const responderRole = responder.role === 'client' ? 'client' : 'attorney';
    if (responderRole === counterOffer.initiatorRole) {
      return { success: false, error: 'You cannot respond to your own counteroffer' };
    }

    // Get thread for system message
    const thread = counterOffer.threadId
      ? await db.select().from(quoteThreads).where(eq(quoteThreads.id, counterOffer.threadId)).limit(1).then(r => r[0])
      : await getThreadByQuoteRequest(counterOffer.quoteRequestId);

    if (action === 'accept') {
      // Update counteroffer status
      await db
        .update(quoteCounterOffers)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
          respondedBy: responderId,
          responseNote,
          updatedAt: new Date(),
        })
        .where(eq(quoteCounterOffers.id, counterOfferId));

      // Update quote with new amount if proposed
      if (counterOffer.proposedAmount) {
        await db
          .update(quoteRequests)
          .set({
            amount: counterOffer.proposedAmount,
            updatedAt: new Date(),
          })
          .where(eq(quoteRequests.id, counterOffer.quoteRequestId));
      }

      // Clear current counteroffer reference
      await db
        .update(quoteRequests)
        .set({
          currentCounterofferId: null,
          updatedAt: new Date(),
        })
        .where(eq(quoteRequests.id, counterOffer.quoteRequestId));

      // Post system message
      if (thread) {
        const amountText = counterOffer.proposedAmount
          ? ` Quote amount updated to $${counterOffer.proposedAmount.toLocaleString()}.`
          : '';
        await sendSystemMessage(
          thread.id,
          `Counteroffer has been accepted.${amountText}`
        );
      }
    } else {
      // Reject the counteroffer
      await db
        .update(quoteCounterOffers)
        .set({
          status: 'rejected',
          respondedAt: new Date(),
          respondedBy: responderId,
          responseNote,
          updatedAt: new Date(),
        })
        .where(eq(quoteCounterOffers.id, counterOfferId));

      // Clear current counteroffer reference
      await db
        .update(quoteRequests)
        .set({
          currentCounterofferId: null,
          updatedAt: new Date(),
        })
        .where(eq(quoteRequests.id, counterOffer.quoteRequestId));

      // Post system message
      if (thread) {
        await sendSystemMessage(
          thread.id,
          `Counteroffer has been declined.${responseNote ? ` Reason: ${responseNote}` : ''}`
        );
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error responding to counteroffer:', error);
    return { success: false, error: 'Failed to respond to counteroffer' };
  }
}

/**
 * Withdraws a pending counteroffer
 * - Only the initiator can withdraw
 */
export async function withdrawCounterOffer(
  counterOfferId: string,
  userId: string
): Promise<ActionResult> {
  try {
    // Get the counteroffer
    const [counterOffer] = await db
      .select()
      .from(quoteCounterOffers)
      .where(eq(quoteCounterOffers.id, counterOfferId))
      .limit(1);

    if (!counterOffer) {
      return { success: false, error: 'Counteroffer not found' };
    }

    if (counterOffer.status !== 'pending') {
      return { success: false, error: 'Counteroffer is no longer pending' };
    }

    // Only initiator can withdraw
    if (counterOffer.initiatorId !== userId) {
      return { success: false, error: 'Only the initiator can withdraw a counteroffer' };
    }

    // Update counteroffer status
    await db
      .update(quoteCounterOffers)
      .set({
        status: 'withdrawn',
        updatedAt: new Date(),
      })
      .where(eq(quoteCounterOffers.id, counterOfferId));

    // Clear current counteroffer reference
    await db
      .update(quoteRequests)
      .set({
        currentCounterofferId: null,
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, counterOffer.quoteRequestId));

    // Post system message
    const thread = counterOffer.threadId
      ? await db.select().from(quoteThreads).where(eq(quoteThreads.id, counterOffer.threadId)).limit(1).then(r => r[0])
      : await getThreadByQuoteRequest(counterOffer.quoteRequestId);

    if (thread) {
      await sendSystemMessage(thread.id, 'Counteroffer has been withdrawn.');
    }

    return { success: true };
  } catch (error) {
    console.error('Error withdrawing counteroffer:', error);
    return { success: false, error: 'Failed to withdraw counteroffer' };
  }
}

export interface ReviseQuoteResult extends ActionResult {
  previousAmount?: number;
  newAmount?: number;
  threadId?: string;
}

/**
 * Updates a quote directly (attorney-only revision)
 * - Creates a revision record for audit trail
 * - Updates the quote amount/description immediately
 * - Stores original amount on first revision for display
 * - Returns previous/new amounts for message modal
 */
export async function reviseQuote(params: {
  quoteRequestId: string;
  attorneyId: string;
  newAmount?: number;
  newDescription?: string;
  reason: string;
}): Promise<ReviseQuoteResult> {
  const { quoteRequestId, attorneyId, newAmount, newDescription, reason } = params;

  try {
    // Validate quote exists and is pending
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    if (quote.status !== 'pending') {
      return { success: false, error: 'Can only revise pending quotes' };
    }

    // Validate attorney owns this quote
    if (quote.attorneyId !== attorneyId) {
      return { success: false, error: 'You can only revise your own quotes' };
    }

    // Get thread for system message
    const thread = await getThreadByQuoteRequest(quoteRequestId);

    // Calculate revision round
    const revisionRound = (quote.negotiationRoundCount || 0) + 1;

    // Store the previous amount before update
    const previousAmount = quote.amount;

    // Create a revision record for audit trail (using counteroffer table)
    await db
      .insert(quoteCounterOffers)
      .values({
        quoteRequestId,
        threadId: thread?.id,
        initiatorId: attorneyId,
        initiatorRole: 'attorney',
        proposedAmount: newAmount,
        scopeChanges: newDescription,
        reason,
        negotiationRound: revisionRound,
        status: 'accepted', // Auto-accepted since attorney is updating their own quote
        respondedAt: new Date(),
        respondedBy: attorneyId,
      });

    // Update the quote with new values
    // Build update object conditionally
    const baseUpdate = {
      updatedAt: new Date(),
      negotiationRoundCount: revisionRound,
    };

    // On first revision, store the original amount
    // Note: DB NULL can be returned as undefined or null, so check for both
    const originalAmountUpdate = (quote.originalAmount === null || quote.originalAmount === undefined) && newAmount !== undefined
      ? { originalAmount: quote.amount }
      : {};

    const amountUpdate = newAmount !== undefined
      ? { amount: newAmount }
      : {};

    const descriptionUpdate = newDescription !== undefined
      ? { description: newDescription }
      : {};

    await db
      .update(quoteRequests)
      .set({
        ...baseUpdate,
        ...originalAmountUpdate,
        ...amountUpdate,
        ...descriptionUpdate,
      })
      .where(eq(quoteRequests.id, quoteRequestId));

    // Post system message to thread (brief notification)
    if (thread) {
      const changes: string[] = [];
      if (newAmount !== undefined && newAmount !== quote.amount) {
        changes.push(`amount updated from $${quote.amount.toLocaleString()} to $${newAmount.toLocaleString()}`);
      }
      if (newDescription !== undefined && newDescription !== quote.description) {
        changes.push('description updated');
      }
      const changesText = changes.length > 0 ? changes.join(' and ') : 'quote details';
      await sendSystemMessage(
        thread.id,
        `Quote revised: ${changesText}.`,
        attorneyId // Use attorney as sender for FK compliance
      );
    }

    // Reset notification state so the client sees the "Quote Revised" notification
    // Get the screening ID to construct the notification ID
    const [quoteWithScreening] = await db
      .select({ screeningId: quoteRequests.screeningId })
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteRequestId))
      .limit(1);

    if (quoteWithScreening) {
      const notificationId = `quote-revised-${quoteWithScreening.screeningId}`;

      // Get the client's user ID from the screening
      const [screening] = await db
        .select({ userId: screenings.userId })
        .from(screenings)
        .where(eq(screenings.id, quoteWithScreening.screeningId))
        .limit(1);

      if (screening) {
        // Reset the notification state (un-dismiss and mark as unread)
        await db
          .update(notificationStates)
          .set({
            isDismissed: false,
            isRead: false,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(notificationStates.userId, screening.userId),
              eq(notificationStates.notificationId, notificationId)
            )
          );
      }
    }

    return {
      success: true,
      previousAmount,
      newAmount: newAmount ?? quote.amount,
      threadId: thread?.id,
    };
  } catch (error) {
    console.error('Error revising quote:', error);
    // Log more details for debugging
    if (error instanceof Error) {
      console.error('Error details:', error.message, error.stack);
    }
    return { success: false, error: 'Failed to revise quote' };
  }
}

/**
 * Checks and marks expired counteroffers for a quote request
 */
export async function checkAndExpireCounterOffers(
  quoteRequestId: string
): Promise<void> {
  const now = new Date();

  // Find pending counteroffers that have expired
  const expiredOffers = await db
    .select()
    .from(quoteCounterOffers)
    .where(
      and(
        eq(quoteCounterOffers.quoteRequestId, quoteRequestId),
        eq(quoteCounterOffers.status, 'pending')
      )
    );

  for (const offer of expiredOffers) {
    if (offer.expiresAt && offer.expiresAt < now) {
      await db
        .update(quoteCounterOffers)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(quoteCounterOffers.id, offer.id));

      // Clear current counteroffer reference if this was the current one
      await db
        .update(quoteRequests)
        .set({
          currentCounterofferId: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quoteRequests.id, quoteRequestId),
            eq(quoteRequests.currentCounterofferId, offer.id)
          )
        );

      // Post system message
      const thread = await getThreadByQuoteRequest(quoteRequestId);
      if (thread) {
        await sendSystemMessage(thread.id, 'Counteroffer has expired.');
      }
    }
  }
}
