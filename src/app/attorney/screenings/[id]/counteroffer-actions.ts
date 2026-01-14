'use server';

import { revalidatePath } from 'next/cache';
import { requireRole, getCurrentUser } from '@/lib/role-middleware';
import {
  createCounterOffer,
  respondToCounterOffer,
  withdrawCounterOffer,
  getActiveCounterOffer,
  getCounterOfferHistory,
  checkAndExpireCounterOffers,
  reviseQuote,
  type CreateCounterOfferParams,
  type CounterOfferWithDetails,
} from '@/lib/counteroffer-service';
import { sendMessage } from '@/lib/quote-thread-service';
import { type QuoteCounterOffer } from '@/lib/db/schema';

// ============================================================================
// SUBMIT COUNTEROFFER
// ============================================================================

export async function submitCounterOfferAction(
  params: Omit<CreateCounterOfferParams, 'initiatorId' | 'initiatorRole'> & { screeningId: string }
): Promise<{ success: boolean; counterOfferId?: string; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'client', 'super_admin']);

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Determine initiator role based on user role
    const initiatorRole = user.role === 'client' ? 'client' : 'attorney';

    const result = await createCounterOffer({
      ...params,
      initiatorId: user.id,
      initiatorRole,
    });

    if (result.success && result.counterOffer) {
      revalidatePath(`/attorney/screenings/${params.screeningId}`);
      revalidatePath(`/screenings/${params.screeningId}`);
      revalidatePath(`/my-quotes`);
      revalidatePath(`/attorney/quotes`);

      return { success: true, counterOfferId: result.counterOffer.id };
    }

    return { success: false, error: result.error || 'Failed to create counteroffer' };
  } catch (error) {
    console.error('Error submitting counteroffer:', error);
    return { success: false, error: 'Failed to submit counteroffer' };
  }
}

// ============================================================================
// RESPOND TO COUNTEROFFER
// ============================================================================

export async function respondToCounterOfferAction(
  counterOfferId: string,
  action: 'accept' | 'reject',
  responseNote: string | undefined,
  screeningId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'client', 'super_admin']);

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await respondToCounterOffer({
      counterOfferId,
      responderId: user.id,
      action,
      responseNote,
    });

    if (result.success) {
      revalidatePath(`/attorney/screenings/${screeningId}`);
      revalidatePath(`/screenings/${screeningId}`);
      revalidatePath(`/my-quotes`);
      revalidatePath(`/attorney/quotes`);
    }

    return result;
  } catch (error) {
    console.error('Error responding to counteroffer:', error);
    return { success: false, error: 'Failed to respond to counteroffer' };
  }
}

// ============================================================================
// WITHDRAW COUNTEROFFER
// ============================================================================

export async function withdrawCounterOfferAction(
  counterOfferId: string,
  screeningId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'client', 'super_admin']);

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await withdrawCounterOffer(counterOfferId, user.id);

    if (result.success) {
      revalidatePath(`/attorney/screenings/${screeningId}`);
      revalidatePath(`/screenings/${screeningId}`);
      revalidatePath(`/my-quotes`);
      revalidatePath(`/attorney/quotes`);
    }

    return result;
  } catch (error) {
    console.error('Error withdrawing counteroffer:', error);
    return { success: false, error: 'Failed to withdraw counteroffer' };
  }
}

// ============================================================================
// GET ACTIVE COUNTEROFFER
// ============================================================================

export async function getActiveCounterOfferAction(
  quoteRequestId: string
): Promise<{ success: boolean; counterOffer?: QuoteCounterOffer | null; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'client', 'staff', 'super_admin']);

    // Check for expired counteroffers first
    await checkAndExpireCounterOffers(quoteRequestId);

    const counterOffer = await getActiveCounterOffer(quoteRequestId);

    return { success: true, counterOffer };
  } catch (error) {
    console.error('Error getting active counteroffer:', error);
    return { success: false, error: 'Failed to get active counteroffer' };
  }
}

// ============================================================================
// GET COUNTEROFFER HISTORY
// ============================================================================

export async function getCounterOfferHistoryAction(
  quoteRequestId: string
): Promise<{ success: boolean; history?: CounterOfferWithDetails[]; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'client', 'staff', 'super_admin']);

    // Check for expired counteroffers first
    await checkAndExpireCounterOffers(quoteRequestId);

    const history = await getCounterOfferHistory(quoteRequestId);

    return { success: true, history };
  } catch (error) {
    console.error('Error getting counteroffer history:', error);
    return { success: false, error: 'Failed to get counteroffer history' };
  }
}

// ============================================================================
// REVISE QUOTE (Attorney-only direct update)
// ============================================================================

export async function reviseQuoteAction(params: {
  quoteRequestId: string;
  screeningId: string;
  newAmount?: number;
  newDescription?: string;
  reason: string;
}): Promise<{
  success: boolean;
  error?: string;
  previousAmount?: number;
  newAmount?: number;
  threadId?: string;
}> {
  try {
    await requireRole(['attorney', 'org_admin', 'super_admin']);

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await reviseQuote({
      quoteRequestId: params.quoteRequestId,
      attorneyId: user.id,
      newAmount: params.newAmount,
      newDescription: params.newDescription,
      reason: params.reason,
    });

    if (result.success) {
      revalidatePath(`/attorney/screenings/${params.screeningId}`);
      revalidatePath(`/screenings/${params.screeningId}`);
      revalidatePath(`/my-quotes`);
      revalidatePath(`/attorney/quotes`);
    }

    return result;
  } catch (error) {
    console.error('Error revising quote:', error);
    return { success: false, error: 'Failed to revise quote' };
  }
}

// ============================================================================
// SEND REVISION MESSAGE
// ============================================================================

export async function sendRevisionMessageAction(params: {
  threadId: string;
  screeningId: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(['attorney', 'org_admin', 'super_admin']);

    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const result = await sendMessage({
      threadId: params.threadId,
      senderId: user.id,
      senderRole: 'attorney',
      content: params.message,
    });

    if (result.success) {
      revalidatePath(`/attorney/screenings/${params.screeningId}`);
      revalidatePath(`/screenings/${params.screeningId}`);
    }

    return { success: result.success, error: result.error };
  } catch (error) {
    console.error('Error sending revision message:', error);
    return { success: false, error: 'Failed to send message' };
  }
}
