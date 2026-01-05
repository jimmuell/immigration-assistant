"use server";

import { db } from "@/lib/db";
import { screenings } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function getUserDraftScreenings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  const draftScreenings = await db
    .select()
    .from(screenings)
    .where(
      and(
        eq(screenings.userId, session.user.id),
        eq(screenings.status, 'draft'),
        eq(screenings.isTestMode, false) // Exclude test screenings
      )
    )
    .orderBy(desc(screenings.updatedAt));
  
  return draftScreenings;
}

export async function deleteScreening(screeningId: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership before deleting
  const screening = await db
    .select()
    .from(screenings)
    .where(eq(screenings.id, screeningId))
    .limit(1);

  if (screening.length === 0 || screening[0].userId !== session.user.id) {
    throw new Error('Screening not found or unauthorized');
  }

  await db
    .delete(screenings)
    .where(eq(screenings.id, screeningId));
  
  return { success: true };
}
