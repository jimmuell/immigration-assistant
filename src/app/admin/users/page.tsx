import { requireRole } from "@/lib/role-middleware";
import { requireOrganizationContext } from "@/lib/organization-context";
import { db } from "@/lib/db";
import { users, attorneyProfiles } from "@/lib/db/schema";
import { desc, eq, and } from "drizzle-orm";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { OrganizationSwitcher } from "@/components/super-admin/organization-switcher";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  // Ensure user has org_admin, staff, or super_admin role
  await requireRole(['org_admin', 'staff', 'super_admin']);
  
  // Get organization context
  const organizationId = await requireOrganizationContext();

  // Get all users in organization
  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));
  
  // Get attorneys with profiles (anyone with an attorney profile, regardless of role)
  const attorneys = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
      profile: attorneyProfiles,
    })
    .from(users)
    .innerJoin(attorneyProfiles, eq(users.id, attorneyProfiles.userId)) // Inner join - only users with profiles
    .where(eq(users.organizationId, organizationId))
    .orderBy(desc(users.createdAt));

  const clients = allUsers.filter(u => u.role === 'client');
  const staff = allUsers.filter(u => u.role === 'staff');
  const admins = allUsers.filter(u => u.role === 'org_admin' || u.role === 'staff'); // Both org_admin and staff have admin access

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <OrganizationSwitcher />
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6 space-y-6 md:pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-gray-600 mt-2">Manage attorneys, clients, team members, and administrators</p>
          </div>
        </div>

        <UsersClient 
          attorneys={attorneys}
          clients={clients}
          admins={admins}
          staff={staff}
        />

      </div>
    </div>
  );
}
