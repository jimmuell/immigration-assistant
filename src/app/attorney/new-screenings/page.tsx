import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { screenings, users, organizations, attorneyProfiles } from "@/lib/db/schema";
import { eq, and, or, desc, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileText, Clock, UserCheck } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { AttorneyMobileNav } from "@/components/attorney-mobile-nav";

export default async function NewScreeningsPage() {
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);
  const session = await auth();
  const attorneyId = session?.user?.id;
  const userRole = session?.user?.role;

  // Check if user has an attorney profile
  const [attorneyProfile] = await db
    .select()
    .from(attorneyProfiles)
    .where(eq(attorneyProfiles.userId, attorneyId!))
    .limit(1);

  // Get organization settings
  let requireStaffPreScreening = false;
  if (session?.user?.organizationId) {
    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, session.user.organizationId))
      .limit(1);
    
    requireStaffPreScreening = org?.requireStaffPreScreening || false;
  }

  // Determine visibility logic:
  // - Pure staff (no attorney profile): Always see all screenings
  // - Super admin: Always see all screenings
  // - Attorneys (including org_admin with attorney profile) with requireStaffPreScreening=false: See all unassigned screenings (marketplace mode)
  // - Attorneys (including org_admin with attorney profile) with requireStaffPreScreening=true: Only see screenings reviewed/assigned by staff (gatekeeper mode)
  const isPureStaff = userRole === 'staff' || (userRole === 'org_admin' && !attorneyProfile);
  const isSuperAdmin = userRole === 'super_admin';
  const showAllScreenings = isPureStaff || isSuperAdmin || !requireStaffPreScreening;

  // Build query conditions
  const assignmentCondition = showAllScreenings
    ? isNull(screenings.assignedAttorneyId) // Marketplace: Show all unassigned (not yet accepted quotes)
    : eq(screenings.reviewedForAttorneyId, attorneyId!); // Gatekeeper: Only show if staff reviewed for me

  // Fetch new screenings
  const newScreenings = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      status: screenings.status,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      assignedAttorneyId: screenings.assignedAttorneyId,
      reviewedForAttorneyId: screenings.reviewedForAttorneyId,
      clientName: users.name,
      clientEmail: users.email,
      clientId: users.id,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .where(
      and(
        eq(screenings.isTestMode, false), // Exclude test screenings
        or(
          eq(screenings.status, 'assigned'),
          eq(screenings.status, 'submitted')
        ),
        assignmentCondition
      )
    )
    .orderBy(desc(screenings.createdAt));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'submitted':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <AttorneyMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-6">
        <DashboardHeader
          title="New Screenings"
          icon={<FileText className="h-8 w-8 text-blue-600" />}
        />

        {/* Info Card */}
        {requireStaffPreScreening && attorneyProfile && !isSuperAdmin ? (
          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-start gap-3">
              <UserCheck className="h-5 w-5 text-purple-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-purple-900 mb-1">Staff Pre-Screening Enabled</h3>
                <p className="text-sm text-purple-700">
                  Your organization has staff pre-screening enabled. You'll only see screenings that have been 
                  reviewed and assigned to you by your staff. This ensures all cases are properly vetted before reaching you.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How It Works</h3>
                <p className="text-sm text-blue-700">
                  This page shows all client screenings awaiting review. <strong>Available</strong> screenings 
                  can be reviewed by any attorney. <strong>Assigned to You</strong> screenings are specifically 
                  assigned to you. You can sort and filter to find screenings that match your expertise.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Screenings List */}
        <Card className="p-6 bg-white">
          {newScreenings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No new screenings</p>
              <p className="text-sm">New screenings from clients will appear here for you to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-4 text-sm text-muted-foreground">
                {newScreenings.length} screening{newScreenings.length !== 1 ? 's' : ''}
              </div>
              {newScreenings.map((screening) => {
                // In gatekeeper mode, reviewedForAttorneyId means it's assigned to me for review
                const isReviewedForMe = requireStaffPreScreening && screening.reviewedForAttorneyId === attorneyId;
                const isUnassigned = !screening.assignedAttorneyId;
                
                return (
                <Card key={screening.id} className={`p-4 hover:shadow-md transition-shadow ${
                  isReviewedForMe ? 'border-2 border-blue-400 bg-blue-50/30' : 'border border-gray-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isReviewedForMe ? (
                          <UserCheck className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-600" />
                        )}
                        <h3 className="font-semibold text-base sm:text-lg truncate">{screening.flowName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(screening.status)}`}>
                          {screening.status.replace('_', ' ')}
                        </span>
                        {isReviewedForMe && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-blue-100 text-blue-700">
                            Assigned to You
                          </span>
                        )}
                        {!requireStaffPreScreening && isUnassigned && (
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap bg-gray-100 text-gray-700">
                            Available
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {screening.clientName?.charAt(0) || screening.clientEmail?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{screening.clientName || screening.clientEmail}</span>
                        </div>
                        <span suppressHydrationWarning>
                          Submitted {new Date(screening.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="sm:shrink-0">
                      <Link href={`/attorney/screenings/${screening.id}`}>
                        <Button size="sm" className="w-full sm:w-auto whitespace-nowrap">
                          {isReviewedForMe ? 'Review' : 'View Details'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

