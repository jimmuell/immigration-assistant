import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { users, conversations, screenings } from "@/lib/db/schema";
import { eq, desc, count, and, ne } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { CheckCircle, Clock, FileText, UserCheck } from "lucide-react";
import { AttorneyMobileNav } from "@/components/attorney-mobile-nav";

export default async function AttorneyDashboard() {
  // Ensure user has attorney, org_admin, staff, or super_admin role
  await requireRole(['attorney', 'org_admin', 'staff', 'super_admin']);

  const session = await auth();
  const attorneyId = session?.user?.id;

  // Get assigned screenings with client info (excluding test screenings)
  // Note: Only show screenings specifically assigned to this attorney on dashboard
  // (The "New Screenings" page shows both assigned + unassigned)
  const assignedScreenings = await db
    .select({
      id: screenings.id,
      flowName: screenings.flowName,
      submissionId: screenings.submissionId,
      status: screenings.status,
      createdAt: screenings.createdAt,
      updatedAt: screenings.updatedAt,
      clientName: users.name,
      clientEmail: users.email,
      clientId: users.id,
    })
    .from(screenings)
    .leftJoin(users, eq(users.id, screenings.userId))
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        ne(screenings.status, 'draft'),
        eq(screenings.isTestMode, false) // Exclude test screenings
      )
    )
    .orderBy(desc(screenings.updatedAt))
    .limit(20);

  // Get stats (excluding test screenings)
  const [assignedCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.isTestMode, false)
      )
    );

  const [inProgressCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.status, 'in_progress'),
        eq(screenings.isTestMode, false)
      )
    );

  const [quotedCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.status, 'quoted'),
        eq(screenings.isTestMode, false)
      )
    );

  const [awaitingClientCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(
      and(
        eq(screenings.assignedAttorneyId, attorneyId!),
        eq(screenings.status, 'awaiting_client'),
        eq(screenings.isTestMode, false)
      )
    );

  // Format date range for display
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateRange = `${thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-blue-100 text-blue-700';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'awaiting_client':
        return 'bg-orange-100 text-orange-700';
      case 'quoted':
        return 'bg-purple-100 text-purple-700';
      case 'quote_accepted':
        return 'bg-green-100 text-green-700';
      case 'reviewed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assigned':
      case 'in_progress':
        return <Clock className="h-4 w-4" />;
      case 'quoted':
      case 'quote_accepted':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24 md:pb-6">
      <AttorneyMobileNav />
      <div className="container mx-auto p-6 md:pt-8 space-y-8">
        <DashboardHeader userName={session?.user?.name?.split(' ')[0]} />

        {/* Stats Cards - 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Assigned Screenings"
            value={assignedCount?.count || 0}
            change={15}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount?.count || 0}
            change={22}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
          <StatsCard
            title="Awaiting Client"
            value={awaitingClientCount?.count || 0}
            change={-5}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="down"
          />
          <StatsCard
            title="Quotes Sent"
            value={quotedCount?.count || 0}
            change={25}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
        </div>

        {/* Assigned Screenings List */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              My Assigned Screenings
            </h2>
            <span className="text-sm text-muted-foreground">{assignedScreenings.length} screening{assignedScreenings.length !== 1 ? 's' : ''}</span>
          </div>
          
          {assignedScreenings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">No assigned screenings yet</p>
              <p className="text-sm">Screenings assigned to you by admins will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedScreenings.map((screening) => (
                <Card key={screening.id} className="p-4 hover:shadow-md transition-shadow border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {getStatusIcon(screening.status)}
                        <h3 className="font-semibold text-base sm:text-lg truncate">{screening.flowName}</h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(screening.status)}`}>
                          {screening.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <div className="flex items-center gap-1">
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                            {screening.clientName?.charAt(0) || screening.clientEmail?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{screening.clientName || screening.clientEmail}</span>
                        </div>
                        <span suppressHydrationWarning>
                          Updated {new Date(screening.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="sm:shrink-0">
                      <Link href={`/attorney/screenings/${screening.id}`}>
                        <Button size="sm" className="w-full sm:w-auto whitespace-nowrap">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
