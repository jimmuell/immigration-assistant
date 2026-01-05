import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

// POST - Reset user password to testing password (simulates email password reset)
export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only org_admin can reset passwords
    if (!session?.user || session.user.role !== 'org_admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can reset passwords." },
        { status: 403 }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Verify the user exists and belongs to the same organization
    const [userToReset] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userToReset) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (userToReset.organizationId !== session.user.organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. User belongs to a different organization." },
        { status: 403 }
      );
    }

    // Cannot reset org_admin password
    if (userToReset.role === 'org_admin') {
      return NextResponse.json(
        { error: "Cannot reset organization admin password" },
        { status: 400 }
      );
    }

    // Reset password to testing password (simulating email-based password reset)
    const newPassword = '12345678';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    console.log(`Password reset for ${userToReset.email} to: ${newPassword}`);

    return NextResponse.json({
      message: "Password reset successfully",
      newPassword: newPassword, // For testing - show the new password
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "An error occurred while resetting the password" },
      { status: 500 }
    );
  }
}

