import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, attorneyProfiles, organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { z } from "zod";

const attorneySignupSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  
  // Firm information
  firmType: z.enum(['solo', 'part_of_firm']).default('solo'),
  firmWebsite: z.string().optional(),
  firmName: z.string().optional(),
  confirmJoinExisting: z.boolean().optional(), // Confirms user wants to join existing org
  
  // Attorney profile
  bio: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  yearsOfExperience: z.number().optional(),
  barNumber: z.string().optional(),
  barState: z.string().optional(),
}).refine((data) => {
  // If part_of_firm, firmWebsite is required
  if (data.firmType === 'part_of_firm' && !data.firmWebsite) {
    return false;
  }
  return true;
}, {
  message: "Firm website is required when joining a law firm",
  path: ["firmWebsite"],
});

// Helper function to normalize domain
function normalizeDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return url.replace(/^www\./, '').toLowerCase();
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = attorneySignupSchema.parse(body);

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, validatedData.email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    let organizationId: string;
    let isNewOrganization = false;
    let userRole: 'attorney' | 'org_admin' = 'attorney';

    if (validatedData.firmType === 'part_of_firm' && validatedData.firmWebsite) {
      // Normalize the domain
      const domainKey = normalizeDomain(validatedData.firmWebsite);

      // Check if organization with this domain already exists
      const [existingOrg] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.domainKey, domainKey))
        .limit(1);

      if (existingOrg) {
        // Organization with this domain exists
        // Check if user confirmed they want to join
        if (!validatedData.confirmJoinExisting) {
          return NextResponse.json(
            { 
              error: "confirmation_required",
              requiresConfirmation: true,
              organization: {
                name: existingOrg.displayName || existingOrg.name,
                website: existingOrg.website,
              },
              message: `We found an existing organization "${existingOrg.displayName || existingOrg.name}" with this website. Please confirm you want to join this organization.`
            },
            { status: 409 } // Conflict - requires user decision
          );
        }
        
        // Join existing organization (user confirmed)
        organizationId = existingOrg.id;
        userRole = 'attorney'; // Subsequent attorneys join as regular attorneys
        
        console.log(`Attorney ${validatedData.email} joining existing organization: ${existingOrg.name} (${domainKey})`);
      } else {
        // Create new law firm organization
        if (!validatedData.firmName) {
          return NextResponse.json(
            { error: "Firm name is required when creating a new organization" },
            { status: 400 }
          );
        }
        
        const [newOrg] = await db
          .insert(organizations)
          .values({
            name: validatedData.firmName,
            displayName: validatedData.firmName, // Set display name for UI
            type: 'law_firm',
            website: validatedData.firmWebsite,
            domainKey: domainKey,
            contactEmail: validatedData.email,
          })
          .returning();
        
        organizationId = newOrg.id;
        isNewOrganization = true;
        userRole = 'org_admin'; // First attorney from a firm becomes org_admin
        
        console.log(`Created new law firm organization: ${newOrg.name} (${domainKey})`);
      }
    } else {
      // Solo attorney - create personal organization
      const orgName = `${validatedData.name}'s Practice`;
      const [soloOrg] = await db
        .insert(organizations)
        .values({
          name: orgName,
          displayName: orgName,
          type: 'solo_attorney',
          contactEmail: validatedData.email,
          website: null,
          domainKey: null, // Solo attorneys don't have a domain key
        })
        .returning();
      
      organizationId = soloOrg.id;
      isNewOrganization = true;
      userRole = 'org_admin'; // Solo attorneys are their own admin
      
      console.log(`Created solo attorney organization: ${soloOrg.name}`);
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
        role: userRole,
      })
      .returning();

    // Create attorney profile
    await db
      .insert(attorneyProfiles)
      .values({
        userId: user.id,
        organizationId,
        bio: validatedData.bio || null,
        specialties: validatedData.specialties || [],
        yearsOfExperience: validatedData.yearsOfExperience || null,
        barNumber: validatedData.barNumber || null,
        barState: validatedData.barState || null,
      });

    return NextResponse.json(
      { 
        message: "Attorney account created successfully",
        isNewOrganization,
        role: userRole,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
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

    console.error("Error creating attorney account:", error);
    return NextResponse.json(
      { error: "An error occurred while creating your account. Please try again." },
      { status: 500 }
    );
  }
}

