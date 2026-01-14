import { requireRole } from "@/lib/role-middleware";
import { requireOrganizationContext } from "@/lib/organization-context";
import { db } from "@/lib/db";
import { users, conversations, messages, screenings } from "@/lib/db/schema";
import { and, count, desc, eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UserCog, GitBranch, ClipboardList, ArrowRight, Users, MessageSquare, UserPlus, Briefcase } from "lucide-react";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { auth } from "@/lib/auth";
import { OrganizationSwitcher } from "@/components/super-admin/organization-switcher";

export default async function AdminDashboard() {
  // Ensure user has admin role
  await requireRole(['org_admin', 'staff', 'super_admin']);
  
  // Get organization context
  const organizationId = await requireOrganizationContext();

  const session = await auth();

  // Get user stats by role - filtered by organization
  const roleStats = await db
    .select({
      role: users.role,
      count: count(),
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .groupBy(users.role);

  // Get total users - filtered by organization
  const [totalUsers] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.organizationId, organizationId));

  // Get total conversations and messages - filtered by organization
  const [conversationCount] = await db
    .select({ count: count() })
    .from(conversations)
    .where(eq(conversations.organizationId, organizationId));

  // Messages don't have organizationId, so we need to join with conversations
  // Wrapped in try-catch to handle cases where messages table may not exist
  let messageCount: { count: number } | undefined;
  try {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .innerJoin(conversations, eq(messages.conversationId, conversations.id))
      .where(eq(conversations.organizationId, organizationId));
    messageCount = result;
  } catch {
    // Messages table may not exist or query failed - default to 0
    messageCount = { count: 0 };
  }

  // Get screenings count - filtered by organization (excluding test screenings)
  const [screeningsCount] = await db
    .select({ count: count() })
    .from(screenings)
    .where(
      and(
        eq(screenings.organizationId, organizationId),
        eq(screenings.isTestMode, false)
      )
    );

  // Get recent users - filtered by organization
  const recentUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt))
    .limit(5);

  const clientCount = roleStats.find(s => s.role === 'client')?.count || 0;
  const attorneyCount = roleStats.find(s => s.role === 'attorney')?.count || 0;
  const adminCount = roleStats.find(s => s.role === 'org_admin')?.count || 0;
  const staffCount = roleStats.find(s => s.role === 'staff')?.count || 0;

  // Format date range for display
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateRange = `${thirtyDaysAgo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <OrganizationSwitcher />
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6 md:pt-8 space-y-8">
        <DashboardHeader userName={session?.user?.name?.split(' ')[0]} />

        {/* Stats Cards - 4 Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={totalUsers?.count || 0}
            change={20}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
          <StatsCard
            title="Active Clients"
            value={clientCount}
            change={15}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
          <StatsCard
            title="Conversations"
            value={conversationCount?.count || 0}
            change={12}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
          <StatsCard
            title="Completed Screenings"
            value={screeningsCount?.count || 0}
            change={8}
            period="Last 30 Days"
            dateRange={dateRange}
            trend="up"
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attorneys</p>
                <p className="text-2xl font-bold">{attorneyCount}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messageCount?.count || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <UserCog className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Administrators</p>
                <p className="text-2xl font-bold">{adminCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team Management Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-600 rounded-lg">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Invite Team Members</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Add paralegals, secretaries, or other attorneys to help manage your practice
                </p>
                <div className="flex items-center gap-2">
                  <Link href="/admin/users?tab=team">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Manage Team
                    </Button>
                  </Link>
                  {staffCount > 0 && (
                    <span className="text-sm text-gray-700 font-medium">
                      {staffCount} team member{staffCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Attorney Dashboard Card */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-600 rounded-lg">
                <Briefcase className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Attorney Dashboard</h3>
                <p className="text-sm text-gray-700 mb-4">
                  Manage your cases, submit quotes, and communicate with clients
                </p>
                <Link href="/attorney">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Go to Attorney Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Users */}
        <Card className="p-4 sm:p-6 bg-white">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold">Recent Users</h2>
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {recentUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users yet
            </div>
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="space-y-3 md:hidden">
                {recentUsers.map((user) => (
                  <div key={user.id} className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{user.name || 'N/A'}</span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'org_admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'attorney' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">{user.email}</p>
                        <p className="text-xs text-muted-foreground mt-1" suppressHydrationWarning>
                          Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                              {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium">{user.name || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.role === 'org_admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'super_admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'attorney' ? 'bg-purple-100 text-purple-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-sm text-muted-foreground" suppressHydrationWarning>
                          {new Date(user.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-all bg-white border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCog className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">User Management</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Manage users, roles, and permissions
          </p>
          <Link href="/admin/users">
            <Button variant="outline" className="w-full group">
              View Users
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all bg-white border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <GitBranch className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Flows</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Configure immigration workflow processes
          </p>
          <Link href="/admin/flows">
            <Button variant="outline" className="w-full group">
              Manage Flows
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all bg-white border-l-4 border-l-green-500">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ClipboardList className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Screenings</h3>
          <p className="text-sm text-muted-foreground mb-4">
            View and manage client screenings
          </p>
          <Link href="/admin/intakes">
            <Button variant="outline" className="w-full group">
              Manage Screenings
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>
        </div>
      </div>
    </div>
  );
}
