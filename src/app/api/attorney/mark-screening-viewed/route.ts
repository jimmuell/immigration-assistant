import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { screeningViews } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const attorneyId = session.user.id;

    // Only allow attorneys, org_admins, staff, and super_admins
    if (!['attorney', 'org_admin', 'staff', 'super_admin'].includes(userRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { screeningId } = await request.json();

    if (!screeningId) {
      return NextResponse.json({ error: "Screening ID is required" }, { status: 400 });
    }

    // Check if already viewed
    const existingView = await db
      .select()
      .from(screeningViews)
      .where(
        and(
          eq(screeningViews.screeningId, screeningId),
          eq(screeningViews.attorneyId, attorneyId)
        )
      )
      .limit(1);

    if (existingView.length === 0) {
      // Insert new view record
      await db.insert(screeningViews).values({
        screeningId,
        attorneyId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking screening as viewed:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
