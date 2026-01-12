import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { screenings, screeningViews, users, attorneyProfiles, organizations } from "@/lib/db/schema";
import { eq, and, or, isNull, inArray, sql } from "drizzle-orm";

export async function GET() {
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

    // Check if user has an attorney profile
    const [attorneyProfile] = await db
      .select()
      .from(attorneyProfiles)
      .where(eq(attorneyProfiles.userId, attorneyId))
      .limit(1);

    // Get organization settings
    let requireStaffPreScreening = false;
    if (session.user.organizationId) {
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, session.user.organizationId))
        .limit(1);
      
      requireStaffPreScreening = org?.requireStaffPreScreening || false;
    }

    // Determine visibility logic (same as new-screenings page)
    const isPureStaff = userRole === 'staff' || (userRole === 'org_admin' && !attorneyProfile);
    const isSuperAdmin = userRole === 'super_admin';
    const showAllScreenings = isPureStaff || isSuperAdmin || !requireStaffPreScreening;

    // Build query conditions
    const assignmentCondition = showAllScreenings
      ? isNull(screenings.assignedAttorneyId)
      : eq(screenings.reviewedForAttorneyId, attorneyId);

    // Get all screenings that match the criteria
    const newScreenings = await db
      .select({
        id: screenings.id,
      })
      .from(screenings)
      .where(
        and(
          eq(screenings.isTestMode, false),
          or(
            eq(screenings.status, 'assigned'),
            eq(screenings.status, 'submitted')
          ),
          assignmentCondition
        )
      );

    if (newScreenings.length === 0) {
      return NextResponse.json({ count: 0 });
    }

    const screeningIds = newScreenings.map(s => s.id);

    // Get viewed screenings for this attorney
    let viewedScreenings = [];
    if (screeningIds.length > 0) {
      try {
        viewedScreenings = await db
          .select({
            screeningId: screeningViews.screeningId,
          })
          .from(screeningViews)
          .where(
            and(
              eq(screeningViews.attorneyId, attorneyId),
              sql`${screeningViews.screeningId} = ANY(${sql.array(screeningIds)})`
            )
          );
      } catch (viewError) {
        console.error("Error querying viewed screenings:", viewError);
        // If there's an error with the viewed screenings query, 
        // assume all screenings are unviewed
        viewedScreenings = [];
      }
    }

    const viewedIds = new Set(viewedScreenings.map(v => v.screeningId));
    const unviewedCount = screeningIds.filter(id => !viewedIds.has(id)).length;

    return NextResponse.json({ count: unviewedCount });
  } catch (error) {
    console.error("Error fetching unviewed screenings count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
