"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, CheckCircle, LogOut, ChevronLeft, ChevronRight, Users, Shield, UserCog, GitBranch, ClipboardList, FileText, DollarSign, CheckSquare, Briefcase, Building2, Crown, FlaskConical } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load collapsed state from localStorage
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem("sidebarCollapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      }
    }
  }, []);

  // Don't render on auth pages or before mounting
  if (!isMounted || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem("sidebarCollapsed", String(newState));
    }
  };

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
      roles: ['client'],
    },
    {
      name: "Saved",
      href: "/saved",
      icon: Bookmark,
      roles: ['client'],
    },
    {
      name: "Completed",
      href: "/completed",
      icon: CheckCircle,
      roles: ['client'],
    },
    {
      name: "Attorney Dashboard",
      href: "/attorney",
      icon: Briefcase,
      roles: ['attorney', 'org_admin'], // Staff doesn't need attorney features
    },
    {
      name: "New Screenings",
      href: "/attorney/new-screenings",
      icon: FileText,
      roles: ['attorney', 'org_admin'],
    },
    {
      name: "Pending Quotes",
      href: "/attorney/pending-quotes",
      icon: DollarSign,
      roles: ['attorney', 'org_admin'],
    },
    {
      name: "Accepted Quotes",
      href: "/attorney/accepted-quotes",
      icon: CheckSquare,
      roles: ['attorney', 'org_admin'],
    },
    {
      name: "Cases",
      href: "/attorney/cases",
      icon: Users,
      roles: ['attorney', 'org_admin'],
    },
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
      roles: ['org_admin', 'staff', 'super_admin'],
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: UserCog,
      roles: ['org_admin', 'staff', 'super_admin'],
    },
    {
      name: "Flows",
      href: "/admin/flows",
      icon: GitBranch,
      roles: ['org_admin', 'staff', 'super_admin'],
    },
    {
      name: "Screenings",
      href: "/admin/intakes",
      icon: ClipboardList,
      roles: ['org_admin', 'staff', 'super_admin'],
    },
    {
      name: "Test Screenings",
      href: "/test-screenings",
      icon: FlaskConical,
      roles: ['org_admin', 'staff', 'super_admin'],
    },
    {
      name: "Super Admin",
      href: "/super-admin",
      icon: Crown,
      roles: ['super_admin'],
    },
    {
      name: "Organizations",
      href: "/super-admin/organizations",
      icon: Building2,
      roles: ['super_admin'],
    },
  ];

  // Filter nav items based on user role
  const userRole = session?.user?.role;
  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(userRole as 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin')
  );

  return (
    <aside
      className={`hidden border-r bg-white transition-all duration-300 md:flex md:flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo/Brand */}
      <div className="flex items-center justify-between border-b px-3 py-4">
        {!isCollapsed && (
          <div>
            <h2 className="text-lg font-bold text-blue-900">
              Immigration Assistant
            </h2>
            <p className="text-xs text-gray-600">AI-powered guidance</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollapsed}
          className={`${isCollapsed ? "mx-auto" : ""}`}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-100 text-blue-900"
                  : "text-gray-700 hover:bg-gray-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={isCollapsed ? item.name : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : ""} ${isCollapsed ? "mx-0" : ""}`} />
              {!isCollapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t px-3 py-4">
        {!isCollapsed ? (
          <>
            <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session?.user?.name || "User"}
              </p>
              <p className="text-xs text-gray-600 truncate">{session?.user?.email}</p>
              <p className="text-xs text-blue-600 font-medium capitalize mt-1">
                {session?.user?.role}
              </p>
              {session?.user?.organizationName && (
                <p className="text-xs text-gray-500 truncate mt-1 border-t pt-1">
                  {session.user.organizationName}
                </p>
              )}
            </div>
            <Button
              onClick={() => signOut({ callbackUrl: "/login" })}
              variant="outline"
              className="w-full bg-white text-gray-900 hover:bg-gray-50"
              size="sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="outline"
            className="w-full bg-white text-gray-900 hover:bg-gray-50"
            size="sm"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        )}
      </div>
    </aside>
  );
}
