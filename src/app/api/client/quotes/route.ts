import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { quoteRequests, screenings, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/client/quotes - Fetch all quotes for the logged-in client
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== 'client') {
      return NextResponse.json({ error: "Only clients can access this endpoint" }, { status: 403 });
    }

    const clientId = session.user.id;

    // Fetch all quotes for screenings submitted by this client
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
        createdAt: quoteRequests.createdAt,
        updatedAt: quoteRequests.updatedAt,
        attorneyName: users.name,
        attorneyEmail: users.email,
        flowName: screenings.flowName,
        submissionId: screenings.submissionId,
      })
      .from(quoteRequests)
      .innerJoin(screenings, eq(screenings.id, quoteRequests.screeningId))
      .leftJoin(users, eq(users.id, quoteRequests.attorneyId))
      .where(eq(screenings.userId, clientId))
      .orderBy(desc(quoteRequests.createdAt));

    return NextResponse.json({ quotes });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}
