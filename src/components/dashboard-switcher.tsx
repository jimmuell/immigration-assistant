"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardSwitcherProps {
  userRole: string;
  hasAttorneyProfile?: boolean;
}

export function DashboardSwitcher({ userRole, hasAttorneyProfile = false }: DashboardSwitcherProps) {
  const pathname = usePathname();
  const isOnAdminDashboard = pathname?.startsWith("/admin");
  const isOnAttorneyDashboard = pathname?.startsWith("/attorney");

  // Show switcher if user is org_admin/staff with attorney capabilities OR an attorney
  const canAccessAttorney = userRole === 'attorney' || hasAttorneyProfile;
  const canAccessAdmin = ['org_admin', 'staff', 'super_admin'].includes(userRole);

  // Don't show if user can't access both dashboards
  if (!(canAccessAttorney && canAccessAdmin)) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-3 bg-white border-b border-gray-200">
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
        <Link href="/admin">
          <Button
            variant={isOnAdminDashboard ? "default" : "ghost"}
            size="sm"
            className={
              isOnAdminDashboard
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
            }
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Admin
          </Button>
        </Link>

        <Link href="/attorney">
          <Button
            variant={isOnAttorneyDashboard ? "default" : "ghost"}
            size="sm"
            className={
              isOnAttorneyDashboard
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "text-gray-700 hover:text-gray-900 hover:bg-gray-200"
            }
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Attorney
          </Button>
        </Link>
      </div>
      <span className="text-sm text-gray-600">
        {isOnAdminDashboard && "Managing Practice"}
        {isOnAttorneyDashboard && "Handling Cases"}
      </span>
    </div>
  );
}

