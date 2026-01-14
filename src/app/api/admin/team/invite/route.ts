import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(['staff', 'attorney'] as const, {
    message: "Role must be either 'staff' or 'attorney'"
  }),
});

// Use default password for testing (in production, this would generate random password)
function generateTempPassword(): string {
  return '123456'; // Default password for easy testing
}

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only org_admin can invite team members
    if (!session?.user || session.user.role !== 'org_admin') {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can invite team members." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = inviteSchema.parse(body);

    // Check if user with this email already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create new team member in the same organization
    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: validatedData.role,
        organizationId: session.user.organizationId,
      })
      .returning();

    // TODO: Send invitation email with temporary password
    // await sendInvitationEmail(validatedData.email, tempPassword);

    console.log(`New team member invited: ${validatedData.email} (Role: ${validatedData.role})`);
    console.log(`Default password: ${tempPassword}`);

    return NextResponse.json(
      {
        message: "Team member invited successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
        tempPassword: tempPassword, // For testing - shows default password
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error inviting team member:", error);
    return NextResponse.json(
      { error: "An error occurred while inviting the team member" },
      { status: 500 }
    );
  }
}

