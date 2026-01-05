import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setOrganizationContext } from "@/lib/organization-context";
import { z } from "zod";

const switchSchema = z.object({
  organizationId: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only super admins can switch organization context
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { organizationId } = switchSchema.parse(body);

    // Set the organization context
    await setOrganizationContext(organizationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid organization ID" },
        { status: 400 }
      );
    }

    console.error("Error switching organization context:", error);
    return NextResponse.json(
      { error: "Failed to switch organization context" },
      { status: 500 }
    );
  }
}

