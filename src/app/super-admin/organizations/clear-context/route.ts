import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { clearOrganizationContext } from "@/lib/organization-context";

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only super admins can clear organization context
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Clear the organization context
    await clearOrganizationContext();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing organization context:", error);
    return NextResponse.json(
      { error: "Failed to clear organization context" },
      { status: 500 }
    );
  }
}

