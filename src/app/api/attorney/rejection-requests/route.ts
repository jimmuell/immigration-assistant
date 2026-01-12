import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users } from "@/lib/db/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";

// GET /api/attorney/rejection-requests - Fetch all pending rejection requests for the attorney
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!['attorney', 'org_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: "Only attorneys can access this endpoint" }, { status: 403 });
    }

    const attorneyId = session.user.id;

    // Fetch quotes with rejection requests for this attorney
    const rejectionRequests = await db
      .select({
        id: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        amount: quoteRequests.amount,
        currency: quoteRequests.currency,
        description: quoteRequests.description,
        status: quoteRequests.status,
        acceptedAt: quoteRequests.acceptedAt,
        rejectionRequestReason: quoteRequests.rejectionRequestReason,
        rejectionRequestedAt: quoteRequests.rejectionRequestedAt,
        rejectionApprovedBy: quoteRequests.rejectionApprovedBy,
        rejectionApprovedAt: quoteRequests.rejectionApprovedAt,
        createdAt: quoteRequests.createdAt,
        clientName: users.name,
        clientEmail: users.email,
        clientId: users.id,
        flowName: screenings.flowName,
        submissionId: screenings.submissionId,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .leftJoin(users, eq(users.id, screenings.userId))
      .where(
        and(
          eq(quoteRequests.attorneyId, attorneyId),
          eq(quoteRequests.status, 'accepted'),
          isNotNull(quoteRequests.rejectionRequestedAt),
          eq(screenings.isTestMode, false) // Exclude test screenings
        )
      )
      .orderBy(desc(quoteRequests.rejectionRequestedAt));

    return NextResponse.json({ rejectionRequests });
  } catch (error) {
    console.error("Error fetching rejection requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch rejection requests" },
      { status: 500 }
    );
  }
}
