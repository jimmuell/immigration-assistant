import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { z } from "zod";

const organizationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  type: z.enum(['law_firm', 'solo_attorney', 'non_legal', 'other']),
  contactEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();

    // Only super admins can create organizations
    if (!session?.user || session.user.role !== 'super_admin') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validatedData = organizationSchema.parse(body);

    // Create organization
    const [organization] = await db
      .insert(organizations)
      .values({
        name: validatedData.name,
        type: validatedData.type,
        contactEmail: validatedData.contactEmail || null,
        contactPhone: validatedData.contactPhone || null,
        address: validatedData.address || null,
      })
      .returning();

    return NextResponse.json(organization, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error creating organization:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the organization" },
      { status: 500 }
    );
  }
}

