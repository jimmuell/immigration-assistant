import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const organizationUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  type: z.enum(['law_firm', 'solo_attorney', 'non_legal', 'other']).optional(),
  contactEmail: z.string().email("Invalid email").nullable().optional(),
  contactPhone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
});

// GET single organization
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Only super admins can access this
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(organization);
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching the organization" },
      { status: 500 }
    );
  }
}

// PATCH (update) organization
export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Only super admins can update organizations
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const validatedData = organizationUpdateSchema.parse(body);

    // Check if organization exists
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Update organization
    const [updatedOrganization] = await db
      .update(organizations)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id))
      .returning();

    return NextResponse.json(updatedOrganization);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error updating organization:", error);
    return NextResponse.json(
      { error: "An error occurred while updating the organization" },
      { status: 500 }
    );
  }
}

// DELETE organization
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Only super admins can delete organizations
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    // Check if organization exists
    const [existingOrg] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    if (!existingOrg) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // Prevent deletion of Platform Administration
    if (existingOrg.name === 'Platform Administration') {
      return NextResponse.json(
        { 
          error: "Cannot delete Platform Administration organization. If you have duplicates, please run: npm run db:cleanup-orgs" 
        },
        { status: 400 }
      );
    }

    // Delete organization (cascade will handle related records)
    await db
      .delete(organizations)
      .where(eq(organizations.id, id));

    // Revalidate relevant paths to clear cache
    revalidatePath('/super-admin/organizations');
    revalidatePath('/super-admin');

    return NextResponse.json({ success: true, message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the organization" },
      { status: 500 }
    );
  }
}

