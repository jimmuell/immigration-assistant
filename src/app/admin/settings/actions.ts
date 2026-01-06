"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateOrganizationSettings(
  organizationId: string,
  settings: {
    requireStaffPreScreening?: boolean;
  }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    // Only org_admin, staff, and super_admin can update organization settings
    if (!['org_admin', 'staff', 'super_admin'].includes(session.user.role)) {
      return { success: false, error: "Unauthorized" };
    }

    // Verify user belongs to this organization (unless super_admin)
    if (session.user.role !== 'super_admin' && session.user.organizationId !== organizationId) {
      return { success: false, error: "Unauthorized" };
    }

    // Update organization settings
    await db
      .update(organizations)
      .set({
        requireStaffPreScreening: settings.requireStaffPreScreening,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, organizationId));

    // Revalidate relevant pages
    revalidatePath('/admin/settings');
    revalidatePath('/attorney/new-screenings');
    revalidatePath('/attorney');

    return { success: true };
  } catch (error) {
    console.error("Error updating organization settings:", error);
    return { success: false, error: "Failed to update settings" };
  }
}

