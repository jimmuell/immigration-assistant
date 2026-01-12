import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST /api/attorney/rejection-requests/[id]/approve - Approve a client's rejection request
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!['attorney', 'org_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Only attorneys can approve rejection requests" }, { status: 403 });
    }

    const attorneyId = session.user.id;
    const { id: quoteId } = await params;

    // Fetch the quote and verify it belongs to the attorney
    const [quote] = await db
      .select({
        quoteId: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        attorneyId: quoteRequests.attorneyId,
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

    if (quote.attorneyId !== attorneyId) {
      return NextResponse.json({ error: "You don't have permission to approve this request" }, { status: 403 });
    }

    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { error: "Only accepted quotes can have rejection requests" },
        { status: 400 }
      );
    }

    if (!quote.rejectionRequestedAt) {
      return NextResponse.json(
        { error: "No rejection request found for this quote" },
        { status: 400 }
      );
    }

    // Update the quote to declined and record approval
    await db
      .update(quoteRequests)
      .set({
        status: 'declined',
        declinedAt: new Date(),
        rejectionApprovedBy: attorneyId,
        rejectionApprovedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(quoteRequests.id, quoteId));

    // Update the screening status back to reviewed or submitted
    await db
      .update(screenings)
      .set({
        status: 'reviewed',
        assignedAttorneyId: null,
        updatedAt: new Date(),
      })
      .where(eq(screenings.id, quote.screeningId));

    // Remove client's organization assignment (disconnect from firm)
    await db
      .update(users)
      .set({
        organizationId: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, quote.screeningUserId));

    return NextResponse.json({ 
      success: true,
      message: "Rejection request approved. The client has been notified." 
    });
  } catch (error) {
    console.error("Error approving rejection request:", error);
    return NextResponse.json(
      { error: "Failed to approve rejection request" },
      { status: 500 }
    );
  }
}
