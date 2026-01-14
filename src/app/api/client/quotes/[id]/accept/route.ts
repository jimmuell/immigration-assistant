import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users, quoteCounterOffers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// POST /api/client/quotes/[id]/accept - Accept a quote
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'client') {
      return NextResponse.json({ error: "Only clients can accept quotes" }, { status: 403 });
    }

    const clientId = session.user.id;
    const { id: quoteId } = await params;

    // Fetch the quote and verify it belongs to the client's screening
    const [quote] = await db
      .select({
        quoteId: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        attorneyId: quoteRequests.attorneyId,
        organizationId: quoteRequests.organizationId,
        status: quoteRequests.status,
        screeningUserId: screenings.userId,
        screeningStatus: screenings.status,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .where(eq(quoteRequests.id, quoteId));

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.screeningUserId !== clientId) {
      return NextResponse.json({ error: "You don't have permission to accept this quote" }, { status: 403 });
    }

    if (quote.status !== 'pending') {
      return NextResponse.json(
        { error: `Quote cannot be accepted. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Check if any other quote for this screening has been accepted
    const [existingAcceptedQuote] = await db
      .select({ id: quoteRequests.id })
      .from(quoteRequests)
      .where(
        and(
          eq(quoteRequests.screeningId, quote.screeningId),
          eq(quoteRequests.status, 'accepted')
        )
      );

    if (existingAcceptedQuote) {
      return NextResponse.json(
        { error: "You have already accepted a quote for this screening" },
        { status: 400 }
      );
    }

    // Check for any accepted counteroffers and update quote amount if applicable
    const [acceptedCounteroffer] = await db
      .select()
      .from(quoteCounterOffers)
      .where(
        and(
          eq(quoteCounterOffers.quoteRequestId, quoteId),
          eq(quoteCounterOffers.status, 'accepted')
        )
      )
      .limit(1);

    // Mark any pending counteroffers as superseded
    await db
      .update(quoteCounterOffers)
      .set({
        status: 'superseded',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quoteCounterOffers.quoteRequestId, quoteId),
          eq(quoteCounterOffers.status, 'pending')
        )
      );

    // Update the quote status to accepted and set acceptedAt timestamp
    // If there was an accepted counteroffer with a proposed amount, use that amount
    const updateData: Record<string, unknown> = {
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
      currentCounterofferId: null, // Clear active counteroffer reference
    };

    // Apply accepted counteroffer amount if present
    if (acceptedCounteroffer?.proposedAmount) {
      updateData.amount = acceptedCounteroffer.proposedAmount;
    }

    await db
      .update(quoteRequests)
      .set(updateData)
      .where(eq(quoteRequests.id, quoteId));

    // Update the screening status and assign the attorney
    await db
      .update(screenings)
      .set({
        status: 'quote_accepted',
        assignedAttorneyId: quote.attorneyId,
        updatedAt: new Date(),
      })
      .where(eq(screenings.id, quote.screeningId));

    // Update the client's organization to match the attorney's organization
    // This connects the client to the law firm/organization
    await db
      .update(users)
      .set({
        organizationId: quote.organizationId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clientId));

    // Automatically decline all other pending quotes for this screening
    await db
      .update(quoteRequests)
      .set({
        status: 'declined',
        declinedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(quoteRequests.screeningId, quote.screeningId),
          eq(quoteRequests.status, 'pending')
        )
      );

    // Revalidate relevant paths
    revalidatePath('/my-quotes');
    revalidatePath('/attorney/quotes');
    revalidatePath(`/screenings/${quote.screeningId}`);

    return NextResponse.json({ 
      success: true,
      message: "Quote accepted successfully. You are now connected with the attorney." 
    });
  } catch (error) {
    console.error("Error accepting quote:", error);
    return NextResponse.json(
      { error: "Failed to accept quote" },
      { status: 500 }
    );
  }
}
