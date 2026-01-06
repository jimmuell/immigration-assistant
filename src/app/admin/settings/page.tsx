import { requireRole } from "@/lib/role-middleware";
import { requireOrganizationContext } from "@/lib/organization-context";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card } from "@/components/ui/card";
import { AdminMobileNav } from "@/components/admin-mobile-nav";
import { SettingsClient } from "./settings-client";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  await requireRole(['org_admin', 'staff', 'super_admin']);
  
  const organizationId = await requireOrganizationContext();

  // Get organization settings
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminMobileNav />
      <div className="container mx-auto p-6 pb-24 md:pb-6 md:pt-8 space-y-6">
        <div className="flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-gray-700" />
          <div>
            <h1 className="text-3xl font-bold">Organization Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization preferences and workflow settings
            </p>
          </div>
        </div>

        <SettingsClient organization={organization} />
      </div>
    </div>
  );
}

