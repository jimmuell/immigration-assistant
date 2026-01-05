import { requireRole } from "@/lib/role-middleware";
import { db } from "@/lib/db";
import { organizations, users } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, UserPlus, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { SwitchOrgButton } from "./switch-org-button";
import { UnassignAdminButton } from "./components/unassign-admin-button";

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(['super_admin']);
  
  const { id } = await params;

  // Get organization details
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, id))
    .limit(1);

  if (!organization) {
    notFound();
  }

  // Get users in this organization
  const orgUsers = await db
    .select()
    .from(users)
    .where(eq(users.organizationId, id));

  const admins = orgUsers.filter(u => u.role === 'org_admin');
  const attorneys = orgUsers.filter(u => u.role === 'attorney');
  const clients = orgUsers.filter(u => u.role === 'client');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-6">
          <Link href="/super-admin/organizations">
            <Button variant="ghost" className="mb-4 bg-transparent text-gray-700 hover:bg-gray-100 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Organizations
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              <p className="text-gray-600 mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  organization.type === 'law_firm' ? 'bg-blue-100 text-blue-800' :
                  organization.type === 'solo_attorney' ? 'bg-purple-100 text-purple-800' :
                  organization.type === 'non_legal' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {organization.type.replace('_', ' ')}
                </span>
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/super-admin/organizations/${id}/edit`}>
                <Button variant="outline" className="bg-white text-gray-900 hover:bg-gray-50">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
              {organization.name !== 'Platform Administration' && (
                <SwitchOrgButton organizationId={id} organizationName={organization.name} />
              )}
            </div>
          </div>
        </div>

        {/* Organization Details */}
        <Card className="p-6 bg-white mb-6">
          <h2 className="text-xl font-semibold mb-4">Organization Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Contact Email</p>
              <p className="font-medium">{organization.contactEmail || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Contact Phone</p>
              <p className="font-medium">{organization.contactPhone || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-sm text-gray-600">Address</p>
              <p className="font-medium">{organization.address || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="font-medium" suppressHydrationWarning>
                {new Date(organization.createdAt).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </Card>

        {/* User Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6 bg-white border-l-4 border-l-red-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <Users className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{admins.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-purple-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attorneys</p>
                <p className="text-2xl font-bold">{attorneys.length}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white border-l-4 border-l-blue-500">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-2xl font-bold">{clients.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Admins List */}
        <Card className="p-6 bg-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Organization Admins</h2>
            <Link href={`/super-admin/organizations/${id}/assign-admin`}>
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                <UserPlus className="mr-2 h-4 w-4" />
                Assign Admin
              </Button>
            </Link>
          </div>
          {admins.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">No admins assigned yet</p>
              <Link href={`/super-admin/organizations/${id}/assign-admin`}>
                <Button className="bg-blue-600 text-white hover:bg-blue-700">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign First Admin
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-medium">
                      {admin.name?.charAt(0) || admin.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{admin.name || 'No name'}</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Admin
                    </span>
                    <UnassignAdminButton
                      organizationId={id}
                      adminId={admin.id}
                      adminName={admin.name || ''}
                      adminEmail={admin.email}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Attorneys List */}
        <Card className="p-6 bg-white">
          <h2 className="text-xl font-semibold mb-4">Attorneys ({attorneys.length})</h2>
          {attorneys.length === 0 ? (
            <p className="text-gray-600 text-center py-8">No attorneys yet. Admins can add attorneys from the organization dashboard.</p>
          ) : (
            <div className="space-y-3">
              {attorneys.slice(0, 5).map((attorney) => (
                <div key={attorney.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-medium">
                      {attorney.name?.charAt(0) || attorney.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{attorney.name || 'No name'}</p>
                      <p className="text-sm text-gray-600">{attorney.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                    Attorney
                  </span>
                </div>
              ))}
              {attorneys.length > 5 && (
                <p className="text-sm text-gray-600 text-center pt-2">
                  And {attorneys.length - 5} more attorneys...
                </p>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

