"use server";

import { db } from "@/lib/db";
import { screenings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/role-middleware";
import { revalidatePath } from "next/cache";

export async function deleteScreening(id: string) {
  try {
    // Ensure user has admin role
    await requireRole(['org_admin', 'staff', 'super_admin']);

    // Delete the screening
    await db
      .delete(screenings)
      .where(eq(screenings.id, id));

    // Revalidate the screenings page
    revalidatePath('/admin/intakes');

    return { success: true };
  } catch (error) {
    console.error('Error deleting screening:', error);
    return { success: false, error: 'Failed to delete screening' };
  }
}

export async function assignScreeningToAttorney(screeningId: string, attorneyId: string | null) {
  try {
    // Ensure user has admin role
    await requireRole(['org_admin', 'staff', 'super_admin']);

    // Update the screening with reviewedForAttorneyId (staff gatekeeper assignment)
    // This makes the screening visible to the attorney for review
    // Note: assignedAttorneyId is only set when a quote is accepted
    await db
      .update(screenings)
      .set({ 
        reviewedForAttorneyId: attorneyId || null,
        updatedAt: new Date()
      })
      .where(eq(screenings.id, screeningId));

    // Revalidate the screenings pages
    revalidatePath('/admin/intakes');
    revalidatePath('/attorney/new-screenings');
    revalidatePath('/attorney');

    return { success: true };
  } catch (error) {
    console.error('Error assigning screening:', error);
    return { success: false, error: 'Failed to assign screening' };
  }
}
