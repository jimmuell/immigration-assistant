import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { organizations, users, screenings } from "@/lib/db/schema";
import { count, desc } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Users, ClipboardList, ArrowRight, Plus } from "lucide-react";
import { ViewAsAdminButton } from "@/components/super-admin/view-as-admin-button";

export default async function SuperAdminDashboard() {
  // Ensure user has super_admin role
  await requireRole(['super_admin']);

  // Get total organizations
  const [orgCount] = await db
    .select({ count: count() })
    .from(organizations);

  // Get total users by role
  const roleStats = await db
    .select({
      role: users.role,
      count: count(),
    })
    .from(users)
    .groupBy(users.role);

  // Get total screenings
  const [screeningsCount] = await db
    .select({ count: count() })
    .from(screenings);

  // Get all organizations with their stats
  const orgsWithStats = await db
    .select({
      id: organizations.id,
      name: organizations.name,
      type: organizations.type,
      contactEmail: organizations.contactEmail,
      createdAt: organizations.createdAt,
    })
    .from(organizations)
    .orderBy(desc(organizations.createdAt));

  // Get user counts per organization
  const orgUserCounts = await db
    .select({
      organizationId: users.organizationId,
      role: users.role,
      count: count(),
    })
    .from(users)
    .groupBy(users.organizationId, users.role);

  // Combine org data with user counts
  const organizationsData = orgsWithStats.map(org => {
    const orgUsers = orgUserCounts.filter(u => u.organizationId === org.id);
    const adminCount = orgUsers.find(u => u.role === 'org_admin')?.count || 0;
    const attorneyCount = orgUsers.find(u => u.role === 'attorney')?.count || 0;
    const clientCount = orgUsers.find(u => u.role === 'client')?.count || 0;
    
    return {
      ...org,
      adminCount,
      attorneyCount,
      clientCount,
      totalUsers: adminCount + attorneyCount + clientCount,
    };
  });

  const clientCount = roleStats.find(s => s.role === 'client')?.count || 0;
  const attorneyCount = roleStats.find(s => s.role === 'attorney')?.count || 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Super Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage all organizations and platform settings</p>
          </div>
          <Link href="/super-admin/organizations/create">
            <Button size="lg" className="bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg">
              <Plus className="mr-2 h-5 w-5" />
              New Organization
            </Button>
          </Link>
        </div>

        {/* Platform Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/super-admin/organizations">
            <Card className="p-6 bg-white border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Organizations</p>
                  <p className="text-2xl font-bold">{orgCount?.count || 0}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/super-admin/users-list">
            <Card className="p-6 bg-white border-l-4 border-l-green-500 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                  <p className="text-2xl font-bold">{clientCount}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link href="/super-admin/users-list">
            <Card className="p-6 bg-white border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Attorneys</p>
                  <p className="text-2xl font-bold">{attorneyCount}</p>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="p-6 bg-white border-l-4 border-l-orange-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <ClipboardList className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Screenings</p>
                <p className="text-2xl font-bold">{screeningsCount?.count || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Organizations List */}
        <Card className="p-6 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold">Organizations</h2>
            <Link href="/super-admin/organizations">
              <Button variant="outline" className="bg-white text-gray-900 hover:bg-gray-50">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {organizationsData.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No organizations yet</p>
              <Link href="/super-admin/organizations/create">
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Organization
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Organization</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Admins</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Attorneys</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Clients</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Created</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizationsData.map((org) => (
                    <tr key={org.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{org.name}</p>
                          <p className="text-sm text-gray-500">{org.contactEmail}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.type === 'law_firm' ? 'bg-blue-100 text-blue-800' :
                          org.type === 'solo_attorney' ? 'bg-purple-100 text-purple-800' :
                          org.type === 'non_legal' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {org.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-800 text-sm font-medium">
                          {org.adminCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-800 text-sm font-medium">
                          {org.attorneyCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                          {org.clientCount}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600" suppressHydrationWarning>
                        {new Date(org.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex gap-2 justify-end">
                          <Link href={`/super-admin/organizations/${org.id}`}>
                            <Button variant="outline" size="sm" className="bg-white text-gray-900 hover:bg-gray-50">
                              Manage
                            </Button>
                          </Link>
                          {org.name !== 'Platform Administration' && (
                            <ViewAsAdminButton 
                              organizationId={org.id} 
                              organizationName={org.name} 
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

