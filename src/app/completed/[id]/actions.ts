"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function acceptQuote(quoteId: string, screeningId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Get the quote details including attorney info
    const [quote] = await db
      .select({
        quote: quoteRequests,
        screening: screenings,
        attorney: users,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .innerJoin(users, eq(users.id, quoteRequests.attorneyId))
      .where(and(
        eq(quoteRequests.id, quoteId),
        eq(screenings.id, screeningId),
        eq(screenings.userId, session.user.id)
      ))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Quote not found" };
    }

    if (quote.quote.status !== 'pending') {
      return { success: false, error: "Quote has already been responded to" };
    }

    // Update quote status to accepted
    await db
      .update(quoteRequests)
      .set({
        status: 'accepted',
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.id, quoteId));

    // Update screening status to quote_accepted
    await db
      .update(screenings)
      .set({
        status: 'quote_accepted',
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    // IMPORTANT: Assign client to attorney's organization
    await db
      .update(users)
      .set({
        organizationId: quote.attorney.organizationId,
        updatedAt: new Date()
      })
      .where(eq(users.id, session.user.id));

    revalidatePath(`/completed/${screeningId}`);
    revalidatePath('/completed');
    revalidatePath('/client');
    revalidatePath('/attorney');
    
    return { success: true };
  } catch (error) {
    console.error("Error accepting quote:", error);
    return { success: false, error: "Failed to accept quote" };
  }
}

export async function declineQuote(quoteId: string, screeningId: string, reason?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Verify quote belongs to this user
    const [quote] = await db
      .select()
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .where(and(
        eq(quoteRequests.id, quoteId),
        eq(screenings.id, screeningId),
        eq(screenings.userId, session.user.id)
      ))
      .limit(1);

    if (!quote) {
      return { success: false, error: "Quote not found" };
    }

    if (quote.quote_requests.status !== 'pending') {
      return { success: false, error: "Quote has already been responded to" };
    }

    // Update quote status to declined
    await db
      .update(quoteRequests)
      .set({
        status: 'declined',
        updatedAt: new Date()
      })
      .where(eq(quoteRequests.id, quoteId));

    // Update screening status to quote_declined
    await db
      .update(screenings)
      .set({
        status: 'quote_declined',
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    revalidatePath(`/completed/${screeningId}`);
    revalidatePath('/completed');
    revalidatePath('/attorney');
    
    return { success: true };
  } catch (error) {
    console.error("Error declining quote:", error);
    return { success: false, error: "Failed to decline quote" };
  }
}
