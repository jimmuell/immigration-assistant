"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, CheckCircle, Shield, FileText, DollarSign, Briefcase, Send, UserCog, GitBranch, ClipboardList } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

export function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);

  useEffect(() => {
    // Using setTimeout to avoid direct setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
      if (typeof window !== 'undefined') {
        const savedAdminMenu = localStorage.getItem("showAdminMenu");
        if (savedAdminMenu !== null) {
          setShowAdminMenu(savedAdminMenu === "true");
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Listen for localStorage changes (from other components)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedAdminMenu = localStorage.getItem("showAdminMenu");
      if (savedAdminMenu !== null) {
        setShowAdminMenu(savedAdminMenu === "true");
      }
    };

    // Listen for storage events from other tabs
    window.addEventListener('storage', handleStorageChange);

    // Also poll for changes from same-tab updates (localStorage doesn't fire events for same-tab changes)
    const interval = setInterval(handleStorageChange, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Fetch unviewed screenings count for attorneys
  useEffect(() => {
    const fetchUnviewedCount = async () => {
      if (!session?.user?.role || !['attorney', 'org_admin', 'staff', 'super_admin'].includes(session.user.role)) {
        return;
      }

      try {
        const response = await fetch('/api/attorney/unviewed-screenings-count', {
          method: 'GET',
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setUnviewedCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error fetching unviewed count:', error);
      }
    };

    if (isMounted && session) {
      fetchUnviewedCount();
      const interval = setInterval(fetchUnviewedCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isMounted, session]);

  // Don't render on auth pages or before mounting
  if (!isMounted || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const userRole = session?.user?.role;

  // Define tabs for each role type
  const clientTabs = [
    { name: "Home", href: "/", icon: Home },
    { name: "Saved", href: "/saved", icon: Bookmark },
    { name: "Screenings", href: "/screenings", icon: CheckCircle },
    { name: "Released", href: "/released", icon: Send },
    { name: "Quotes", href: "/my-quotes", icon: DollarSign },
  ];

  const attorneyTabs = [
    { name: "Home", href: "/attorney", icon: Home },
    { name: "New", href: "/attorney/new-screenings", icon: FileText, showBadge: true },
    { name: "Quotes", href: "/attorney/quotes", icon: DollarSign },
    { name: "Cases", href: "/attorney/cases", icon: Briefcase },
  ];

  // Admin tabs - shown when admin mode is enabled (replaces attorney tabs)
  const adminTabs = [
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Users", href: "/admin/users", icon: UserCog },
    { name: "Flows", href: "/admin/flows", icon: GitBranch },
    { name: "Screenings", href: "/admin/intakes", icon: ClipboardList },
  ];

  const canShowAdmin = userRole === 'org_admin' || userRole === 'staff' || userRole === 'super_admin';

  const staffTabs = [
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Screenings", href: "/admin/intakes", icon: FileText },
  ];

  // Select tabs based on role
  let filteredTabs: typeof clientTabs = [];

  if (userRole === 'client') {
    filteredTabs = clientTabs;
  } else if (userRole === 'attorney' || userRole === 'org_admin') {
    // When admin mode enabled, show admin tabs; otherwise attorney tabs
    filteredTabs = (canShowAdmin && showAdminMenu) ? adminTabs : attorneyTabs;
  } else if (userRole === 'staff') {
    filteredTabs = staffTabs;
  } else if (userRole === 'super_admin') {
    // Super admin: show admin tabs when admin mode is on, otherwise attorney tabs
    filteredTabs = showAdminMenu ? adminTabs : attorneyTabs;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg md:hidden">
      <div className="flex items-center justify-around">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href ||
            (tab.href === '/attorney' && pathname === '/attorney') ||
            (tab.href !== '/' && tab.href !== '/attorney' && pathname.startsWith(tab.href));
          const showBadge = 'showBadge' in tab && tab.showBadge && unviewedCount > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                isActive
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <div className="relative">
                <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                {showBadge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-3 bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0 min-w-5 h-4 flex items-center justify-center"
                  >
                    {unviewedCount > 9 ? '9+' : unviewedCount}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium">{tab.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
