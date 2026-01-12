import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// POST /api/client/quotes/[id]/decline - Decline a quote (only if pending)
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
      return NextResponse.json({ error: "Only clients can decline quotes" }, { status: 403 });
    }

    const clientId = session.user.id;
    const { id: quoteId } = await params;

    // Fetch the quote and verify it belongs to the client's screening
    const [quote] = await db
      .select({
        quoteId: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        status: quoteRequests.status,
        screeningUserId: screenings.userId,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .where(eq(quoteRequests.id, quoteId));

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.screeningUserId !== clientId) {
      return NextResponse.json({ error: "You don't have permission to decline this quote" }, { status: 403 });
    }

    if (quote.status !== 'pending') {
      return NextResponse.json(
        { error: `Quote cannot be declined. Current status: ${quote.status}` },
        { status: 400 }
      );
    }

    // Update the quote status to declined
    await db
      .update(quoteRequests)
      .set({
        status: 'declined',
        declinedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, quoteId));

    // Revalidate relevant paths
    revalidatePath('/my-quotes');
    revalidatePath('/attorney/quotes');
    revalidatePath(`/completed/${quote.screeningId}`);

    return NextResponse.json({ 
      success: true,
      message: "Quote declined successfully" 
    });
  } catch (error) {
    console.error("Error declining quote:", error);
    return NextResponse.json(
      { error: "Failed to decline quote" },
      { status: 500 }
    );
  }
}
