import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z.enum(['client', 'attorney', 'org_admin', 'super_admin']).default('client'),
  organizationId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validatedData = signupSchema.parse(body);

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

    // For clients, organizationId is null until they accept a quote
    // For other roles, organizationId must be provided
    let organizationId = validatedData.organizationId || null;
    
    if (!organizationId && validatedData.role !== 'client') {
      // Non-client roles must have an organization
      // Get or create the default "Platform Administration" organization
      let [defaultOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.name, 'Platform Administration'))
        .limit(1);

      if (!defaultOrg) {
        // Create default organization if it doesn't exist
        [defaultOrg] = await db
          .insert(organizations)
          .values({
            name: 'Platform Administration',
            type: 'other',
            contactEmail: 'admin@immigration-assistant.com',
          })
          .returning();
      }
      
      organizationId = defaultOrg.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        organizationId: organizationId,
        email: validatedData.email,
        password: hashedPassword,
        name: validatedData.name || null,
        role: validatedData.role,
      })
      .returning();

    return NextResponse.json(
      { 
        message: "User created successfully",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
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

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "An error occurred during signup" },
      { status: 500 }
    );
  }
}
