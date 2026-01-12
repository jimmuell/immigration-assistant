import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/attorney/quotes - Fetch all quotes submitted by the logged-in attorney
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!['attorney', 'org_admin', 'staff', 'super_admin'].includes(session.user.role || '')) {
      return NextResponse.json({ error: "Only attorneys can access this endpoint" }, { status: 403 });
    }

    const attorneyId = session.user.id;

    // Fetch all quotes submitted by this attorney
    const quotes = await db
      .select({
        id: quoteRequests.id,
        screeningId: quoteRequests.screeningId,
        amount: quoteRequests.amount,
        currency: quoteRequests.currency,
        description: quoteRequests.description,
        expiresAt: quoteRequests.expiresAt,
        status: quoteRequests.status,
        acceptedAt: quoteRequests.acceptedAt,
        declinedAt: quoteRequests.declinedAt,
        rejectionRequestReason: quoteRequests.rejectionRequestReason,
        rejectionRequestedAt: quoteRequests.rejectionRequestedAt,
        rejectionApprovedBy: quoteRequests.rejectionApprovedBy,
        rejectionApprovedAt: quoteRequests.rejectionApprovedAt,
        createdAt: quoteRequests.createdAt,
        updatedAt: quoteRequests.updatedAt,
        clientName: users.name,
        clientEmail: users.email,
        clientId: users.id,
        flowName: screenings.flowName,
        submissionId: screenings.submissionId,
        screeningStatus: screenings.status,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .leftJoin(users, eq(users.id, screenings.userId))
      .where(
        and(
          eq(quoteRequests.attorneyId, attorneyId),
          eq(screenings.isTestMode, false) // Exclude test screenings
        )
      )
      .orderBy(desc(quoteRequests.createdAt));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching attorney quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
