import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // Only super admins can unassign org admins
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { id: organizationId } = await params;
    const { searchParams } = new URL(req.url);
    const adminId = searchParams.get('adminId');

    if (!adminId) {
      return NextResponse.json(
        { error: "Admin ID is required" },
        { status: 400 }
      );
    }

    // Verify the user exists and is an org_admin for this organization
    const [admin] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, adminId),
          eq(users.organizationId, organizationId),
          eq(users.role, 'org_admin')
        )
      )
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: "Admin not found or not assigned to this organization" },
        { status: 404 }
      );
    }

    // Delete the admin user
    await db
      .delete(users)
      .where(eq(users.id, adminId));

    return NextResponse.json(
      { 
        message: "Admin unassigned successfully",
        adminId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unassigning admin:", error);
    return NextResponse.json(
      { error: "Failed to unassign admin" },
      { status: 500 }
    );
  }
}

