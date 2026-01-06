import { requireRole } from "@/lib/role-middleware";
import { requireOrganizationContext } from "@/lib/organization-context";
import { Card } from "@/components/ui/card";
import { db } from "@/lib/db";
import { screenings, users, attorneyProfiles, organizations } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { ScreeningsClient } from "./screenings-client";
import { AdminMobileNav } from "@/components/admin-mobile-nav";

export default async function ScreeningsPage() {
  // Ensure user has admin role
  await requireRole(['org_admin', 'staff', 'super_admin']);

  // Get organization context
  const organizationId = await requireOrganizationContext();

  // Get organization settings
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);
  
  const requireStaffPreScreening = org?.requireStaffPreScreening || false;

  // Fetch all screenings with user info and assigned attorney (excluding test screenings)
  const allScreenings = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      responses: screenings.responses,
      status: screenings.status,
      createdAt: screenings.createdAt,
      userName: users.name,
      userEmail: users.email,
      userId: screenings.userId,
      assignedAttorneyId: screenings.assignedAttorneyId,
      reviewedForAttorneyId: screenings.reviewedForAttorneyId,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .where(eq(screenings.isTestMode, false)) // Exclude test screenings
    .orderBy(desc(screenings.createdAt));

  // Fetch attorneys for assignment dropdown (anyone with an attorney profile, regardless of role)
  const attorneys = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
    })
    .from(users)
    .innerJoin(attorneyProfiles, eq(users.id, attorneyProfiles.userId))
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6 md:pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Screenings</h1>
            <p className="text-muted-foreground mt-1">
              View and manage completed client screenings
            </p>
          </div>
        </div>

        <ScreeningsClient 
          screenings={allScreenings} 
          attorneys={attorneys}
          requireStaffPreScreening={requireStaffPreScreening}
        />
      </div>
    </div>
  );
}
