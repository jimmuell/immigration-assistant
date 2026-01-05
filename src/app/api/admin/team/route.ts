import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";

// GET - List all team members in the organization
export async function GET(req: Request) {
  try {
    const session = await auth();

    // Only org_admin and staff can view team members
    if (!session?.user || !['org_admin', 'staff'].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get all users in the same organization (excluding super_admin and clients)
    const teamMembers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.organizationId, session.user.organizationId),
          ne(users.role, 'super_admin'), // Exclude super admins
          ne(users.role, 'client'), // Exclude clients
        )
      )
      .orderBy(users.createdAt);

    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error("Error fetching team members:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching team members" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a team member
export async function DELETE(req: Request) {
  try {
    const session = await auth();

    // Only org_admin can remove team members
    if (!session?.user || session.user.role !== 'org_admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can remove team members." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the user exists and belongs to the same organization
    const [userToRemove] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userToRemove) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userToRemove.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. User belongs to a different organization." },
        { status: 403 }
      );
    }

    // Prevent removing yourself
    if (userToRemove.id === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the team" },
        { status: 400 }
      );
    }

    // Prevent removing org_admin
    if (userToRemove.role === 'org_admin') {
      return NextResponse.json(
        { error: "Cannot remove organization admin" },
        { status: 400 }
      );
    }

    // Delete the user
    await db
      .delete(users)
      .where(eq(users.id, userId));

    console.log(`Team member removed: ${userToRemove.email} by ${session.user.email}`);

    return NextResponse.json({
      message: "Team member removed successfully",
    });
  } catch (error) {
    console.error("Error removing team member:", error);
    return NextResponse.json(
      { error: "An error occurred while removing the team member" },
      { status: 500 }
    );
  }
}

