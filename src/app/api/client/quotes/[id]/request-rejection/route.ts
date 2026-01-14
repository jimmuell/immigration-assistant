import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// POST /api/client/quotes/[id]/request-rejection - Request to undo an accepted quote
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
      return NextResponse.json({ error: "Only clients can request quote rejection" }, { status: 403 });
    }

    const clientId = session.user.id;
    const { id: quoteId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || reason.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a detailed reason (at least 10 characters)" },
        { status: 400 }
      );
    }

    // Fetch the quote and verify it belongs to the client's screening
    const [quote] = await db
      .select({
        quoteId: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        status: quoteRequests.status,
        rejectionRequestedAt: quoteRequests.rejectionRequestedAt,
        screeningUserId: screenings.userId,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .where(eq(quoteRequests.id, quoteId));

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    if (quote.screeningUserId !== clientId) {
      return NextResponse.json({ error: "You don't have permission to request rejection for this quote" }, { status: 403 });
    }

    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { error: "Only accepted quotes can have rejection requests" },
        { status: 400 }
      );
    }

    if (quote.rejectionRequestedAt) {
      return NextResponse.json(
        { error: "You have already submitted a rejection request for this quote. Please contact the attorney directly." },
        { status: 400 }
      );
    }

    // Update the quote with rejection request details
    await db
      .update(quoteRequests)
      .set({
        rejectionRequestReason: reason,
        rejectionRequestedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, quoteId));

    // Revalidate relevant paths
    revalidatePath('/my-quotes');
    revalidatePath('/attorney/quotes');
    revalidatePath('/attorney/rejection-requests');
    revalidatePath(`/screenings/${quote.screeningId}`);

    return NextResponse.json({ 
      success: true,
      message: "Your rejection request has been submitted. The attorney will review it and contact you." 
    });
  } catch (error) {
    console.error("Error requesting quote rejection:", error);
    return NextResponse.json(
      { error: "Failed to submit rejection request" },
      { status: 500 }
    );
  }
}
