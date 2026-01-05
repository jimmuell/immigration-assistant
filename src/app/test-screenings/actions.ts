"use server";

import { db } from "@/lib/db";
import { screenings } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getTestScreenings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  // Only admins/staff can view test screenings
  const allowedRoles = ['org_admin', 'staff', 'super_admin'];
  if (!allowedRoles.includes(session.user.role)) {
    return [];
  }

  const testScreenings = await db
    .select()
    .from(screenings)
    .where(
      and(
        eq(screenings.organizationId, session.user.organizationId),
        eq(screenings.isTestMode, true),
        ne(screenings.status, 'draft')
      )
    )
    .orderBy(desc(screenings.createdAt));
  
  return testScreenings;
}

export async function deleteTestScreening(screeningId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Only admins/staff can delete test screenings
  const allowedRoles = ['org_admin', 'staff', 'super_admin'];
  if (!allowedRoles.includes(session.user.role)) {
    throw new Error('Unauthorized');
  }

  // Verify it's a test screening in the same organization
  const screening = await db
    .select()
    .from(screenings)
    .where(eq(screenings.id, screeningId))
    .limit(1);

  if (
    screening.length === 0 || 
    screening[0].organizationId !== session.user.organizationId ||
    !screening[0].isTestMode
  ) {
    throw new Error('Screening not found or unauthorized');
  }

  await db
    .delete(screenings)
    .where(eq(screenings.id, screeningId));
  
  return { success: true };
}

