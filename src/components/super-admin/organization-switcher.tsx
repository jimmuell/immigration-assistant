import { isViewingAsOrganization, getViewingOrganizationId, clearOrganizationContext } from "@/lib/organization-context";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { ClearContextButton } from "./clear-context-button";

export async function OrganizationSwitcher() {
  const isViewing = await isViewingAsOrganization();
  
  if (!isViewing) {
    return null;
  }

  const orgId = await getViewingOrganizationId();
  
  if (!orgId) {
    return null;
  }

  // Get organization details
  const [organization] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);

  if (!organization) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 shadow-md" suppressHydrationWarning>
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-5 w-5" />
          <div>
            <p className="text-sm font-medium">
              Viewing as Organization Admin
            </p>
            <p className="text-xs opacity-90">
              {organization.name}
            </p>
          </div>
        </div>
        <ClearContextButton />
      </div>
    </div>
  );
}

