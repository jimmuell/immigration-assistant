import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq, or } from "drizzle-orm";
import { z } from "zod";

const checkDomainSchema = z.object({
  website: z.string().min(1, "Website is required"),
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
    const validatedData = checkDomainSchema.parse(body);

    // Normalize the domain
    const domainKey = normalizeDomain(validatedData.website);

    // Check if organization with this domain exists
    const [existingOrg] = await db
      .select({
        id: organizations.id,
        name: organizations.name,
        displayName: organizations.displayName,
        website: organizations.website,
        type: organizations.type,
        domainKey: organizations.domainKey,
      })
      .from(organizations)
      .where(eq(organizations.domainKey, domainKey))
      .limit(1);

    if (existingOrg) {
      return NextResponse.json({
        exists: true,
        organization: {
          id: existingOrg.id,
          name: existingOrg.displayName || existingOrg.name,
          website: existingOrg.website,
          type: existingOrg.type,
        },
        domainKey,
      });
    }

    return NextResponse.json({
      exists: false,
      domainKey,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    console.error("Error checking firm domain:", error);
    return NextResponse.json(
      { error: "An error occurred while checking the domain" },
      { status: 500 }
    );
  }
}

