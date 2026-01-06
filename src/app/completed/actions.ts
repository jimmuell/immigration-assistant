"use server";

import { db } from "@/lib/db";
import { screenings, users } from "@/lib/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserScreenings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  // Get completed screenings that have NOT been released to attorneys yet
  const userScreenings = await db
    .select({
      id: screenings.id,
      flowId: screenings.flowId,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      responses: screenings.responses,
      status: screenings.status,
      isLocked: screenings.isLocked,
      submittedForReviewAt: screenings.submittedForReviewAt,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      assignedAttorneyId: screenings.assignedAttorneyId,
      attorneyName: users.name,
      attorneyEmail: users.email,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.assignedAttorneyId))
    .where(
      and(
        eq(screenings.userId, session.user.id),
        ne(screenings.status, 'draft'),
        eq(screenings.isLocked, false), // Only show unlocked screenings
        eq(screenings.isTestMode, false) // Exclude test screenings
      )
    )
    .orderBy(desc(screenings.createdAt));
  
  return userScreenings;
}

export async function getReleasedScreenings() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return [];
  }

  // Get screenings that have been released to attorneys (locked)
  const releasedScreenings = await db
    .select({
      id: screenings.id,
      flowId: screenings.flowId,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      responses: screenings.responses,
      status: screenings.status,
      isLocked: screenings.isLocked,
      submittedForReviewAt: screenings.submittedForReviewAt,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      assignedAttorneyId: screenings.assignedAttorneyId,
      attorneyName: users.name,
      attorneyEmail: users.email,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.assignedAttorneyId))
    .where(
      and(
        eq(screenings.userId, session.user.id),
        eq(screenings.isLocked, true), // Only show locked screenings
        eq(screenings.isTestMode, false) // Exclude test screenings
      )
    )
    .orderBy(desc(screenings.submittedForReviewAt));
  
  return releasedScreenings;
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

export async function submitForReview(screeningId: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Update screening to submitted status and lock it
    const [screening] = await db
      .select()
      .from(screenings)
      .where(and(
        eq(screenings.id, screeningId),
        eq(screenings.userId, session.user.id)
      ))
      .limit(1);

    if (!screening) {
      return { success: false, error: "Screening not found" };
    }

    if (screening.isLocked) {
      return { success: false, error: "Screening is already locked" };
    }

    await db
      .update(screenings)
      .set({
        status: 'submitted',
        isLocked: true,
        submittedForReviewAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    revalidatePath('/completed');
    revalidatePath('/client');
    
    return { success: true };
  } catch (error) {
    console.error("Error submitting for review:", error);
    return { success: false, error: "Failed to submit for review" };
  }
}

// This would be called by attorneys when they need client changes
export async function unlockForEditing(screeningId: string, requestMessage?: string) {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Only attorneys can unlock screenings
    if (!['attorney', 'org_admin', 'staff', 'super_admin'].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    await db
      .update(screenings)
      .set({
        status: 'awaiting_client',
        isLocked: false,
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    revalidatePath('/attorney/screenings');
    revalidatePath('/completed');
    
    return { success: true };
  } catch (error) {
    console.error("Error unlocking screening:", error);
    return { success: false, error: "Failed to unlock screening" };
  }
}
