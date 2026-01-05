import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, attorneyProfiles } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { requireOrganizationContext } from "@/lib/organization-context";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const attorneySchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  barNumber: z.string().optional(),
  barState: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only org_admin and super_admin can create attorneys
    if (!session?.user || (session.user.role !== 'org_admin' && session.user.role !== 'super_admin')) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get organization context
    const organizationId = await requireOrganizationContext();

    const body = await req.json();
    const validatedData = attorneySchema.parse(body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create attorney user
    const [user] = await db
      .insert(users)
      .values({
        organizationId,
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
        role: 'attorney',
      })
      .returning();

    // Create attorney profile
    const [profile] = await db
      .insert(attorneyProfiles)
      .values({
        userId: user.id,
        organizationId,
        bio: validatedData.bio || null,
        specialties: validatedData.specialties || [],
        yearsOfExperience: validatedData.yearsOfExperience || null,
        barNumber: validatedData.barNumber || null,
        barState: validatedData.barState || null,
      })
      .returning();

    return NextResponse.json(
      { 
        message: "Attorney created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        profile
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

    console.error("Error creating attorney:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the attorney" },
      { status: 500 }
    );
  }
}

