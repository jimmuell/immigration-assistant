"use server";

import { db } from "@/lib/db";
import { screenings, quoteRequests, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getScreeningById(id: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return null;
  }

  const [screening] = await db
    .select()
    .from(screenings)
    .where(
      and(
        eq(screenings.id, id),
        eq(screenings.userId, session.user.id)
      )
    )
    .limit(1);
  
  return screening || null;
}

export async function acceptQuote(quoteId: string, screeningId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the quote to retrieve the organization ID
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .where(eq(quoteRequests.id, quoteId))
      .limit(1);

    if (!quote) {
      return { success: false, error: 'Quote not found' };
    }

    // Verify the screening belongs to the current user
    const [screening] = await db
      .select()
      .from(screenings)
      .where(
        and(
          eq(screenings.id, screeningId),
          eq(screenings.userId, session.user.id)
        )
      )
      .limit(1);

    if (!screening) {
      return { success: false, error: 'Screening not found or access denied' };
    }

    // Update quote status
    await db
      .update(quoteRequests)
      .set({ 
        status: 'accepted',
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.id, quoteId));

    // Update screening status and assign attorney
    await db
      .update(screenings)
      .set({ 
        status: 'quote_accepted',
        assignedAttorneyId: quote.attorneyId, // Assign the attorney who sent the quote
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    // Assign client to attorney's organization
    await db
      .update(users)
      .set({ 
        organizationId: quote.organizationId,
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id));

    revalidatePath(`/completed/${screeningId}`);
    revalidatePath('/completed');
    revalidatePath('/attorney/quotes');
    revalidatePath('/my-quotes');

    return { success: true };
  } catch (error) {
    console.error('Error accepting quote:', error);
    return { success: false, error: 'Failed to accept quote' };
  }
}

export async function declineQuote(quoteId: string, screeningId: string) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return { success: false, error: 'Not authenticated' };
    }

    // Verify the screening belongs to the current user
    const [screening] = await db
      .select()
      .from(screenings)
      .where(
        and(
          eq(screenings.id, screeningId),
          eq(screenings.userId, session.user.id)
        )
      )
      .limit(1);

    if (!screening) {
      return { success: false, error: 'Screening not found or access denied' };
    }

    // Update quote status
    await db
      .update(quoteRequests)
      .set({ 
        status: 'declined',
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.id, quoteId));

    // Update screening status back to in_progress since quote was declined
    await db
      .update(screenings)
      .set({ 
        status: 'in_progress',
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    revalidatePath(`/completed/${screeningId}`);
    revalidatePath('/completed');
    revalidatePath('/attorney/quotes');
    revalidatePath('/my-quotes');

    return { success: true };
  } catch (error) {
    console.error('Error declining quote:', error);
    return { success: false, error: 'Failed to decline quote' };
  }
}
