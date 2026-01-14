"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, CheckCircle, LogOut, ChevronLeft, ChevronRight, Users, Shield, UserCog, GitBranch, ClipboardList, FileText, DollarSign, CheckSquare, Briefcase, Building2, Crown, FlaskConical, Send, Settings, AlertTriangle, XCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export function DesktopSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false); // Default to hidden
  const [isMounted, setIsMounted] = useState(false);
  const [unviewedCount, setUnviewedCount] = useState(0);
  const [isViewingOrg, setIsViewingOrg] = useState(false);

  // Load collapsed and admin menu visibility state from localStorage
  useEffect(() => {
    // Using setTimeout to avoid direct setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
      if (typeof window !== 'undefined') {
        const savedCollapsed = localStorage.getItem("sidebarCollapsed");
        if (savedCollapsed !== null) {
          setIsCollapsed(savedCollapsed === "true");
        }
        const savedAdminMenu = localStorage.getItem("showAdminMenu");
        if (savedAdminMenu !== null) {
          setShowAdminMenu(savedAdminMenu === "true");
        } else {
          // Default to hidden if no saved preference
          setShowAdminMenu(false);
        }
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Check if super admin is viewing an organization
  useEffect(() => {
    const checkViewingOrg = async () => {
      if (session?.user?.role === 'super_admin') {
        try {
          const response = await fetch('/api/super-admin/check-viewing-org');
          if (response.ok) {
            const data = await response.json();
            setIsViewingOrg(data.isViewingOrg || false);
          }
        } catch (error) {
          console.error('Error checking viewing org:', error);
          setIsViewingOrg(false);
        }
      } else {
        setIsViewingOrg(false);
      }
    };

    if (isMounted && session) {
      checkViewingOrg();
    }
  }, [isMounted, session, pathname]);

  // Fetch unviewed screenings count
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
      
      // Refresh count every 30 seconds
      const interval = setInterval(fetchUnviewedCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isMounted, session]);

  // Refresh count when navigating away from new-screenings page
  useEffect(() => {
    if (pathname === '/attorney/new-screenings' || pathname.startsWith('/attorney/screenings/')) {
      // Refresh count after viewing
      const timer = setTimeout(async () => {
        if (session?.user?.role && ['attorney', 'org_admin', 'staff', 'super_admin'].includes(session.user.role)) {
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
            console.error('Error refreshing count:', error);
          }
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [pathname, session]);

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

  // Toggle admin menu visibility
  const toggleAdminMenu = () => {
    const newState = !showAdminMenu;
    setShowAdminMenu(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem("showAdminMenu", String(newState));
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
      name: "Screenings",
      href: "/screenings",
      icon: CheckCircle,
      roles: ['client'],
    },
    {
      name: "Released",
      href: "/released",
      icon: Send,
      roles: ['client'],
    },
    {
      name: "My Quotes",
      href: "/my-quotes",
      icon: DollarSign,
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
      name: "My Quotes",
      href: "/attorney/quotes",
      icon: DollarSign,
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
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
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
  
  // Determine if user can toggle admin menu (org_admin or attorney role, not pure staff)
  const canToggleAdminMenu = userRole === 'org_admin' || userRole === 'attorney';
  
  // Define which items are "admin" items
  const adminMenuItems = ['/admin', '/admin/users', '/admin/flows', '/admin/intakes', '/admin/settings', '/test-screenings'];
  
  const filteredNavItems = navItems.filter(item => {
    // First check if item is available for this role
    const hasRole = item.roles.includes(userRole as 'client' | 'attorney' | 'org_admin' | 'staff' | 'super_admin');
    if (!hasRole) return false;
    
    // If super admin is not viewing an organization, hide admin menu items
    if (userRole === 'super_admin' && !isViewingOrg && adminMenuItems.includes(item.href)) {
      return false;
    }
    
    // If user can toggle admin menu and it's hidden, filter out admin items
    if (canToggleAdminMenu && !showAdminMenu && adminMenuItems.includes(item.href)) {
      return false;
    }
    
    return true;
  });

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
          const showBadge = item.href === '/attorney/new-screenings' && unviewedCount > 0;

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
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {showBadge && (
                    <Badge 
                      variant="destructive" 
                      className="ml-auto bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5 min-w-6 justify-center"
                    >
                      {unviewedCount}
                    </Badge>
                  )}
                </>
              )}
              {isCollapsed && showBadge && (
                <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {unviewedCount > 9 ? '9+' : unviewedCount}
                </div>
              )}
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
            {/* Menu Toggle for admin users */}
            {canToggleAdminMenu && (
              <Button
                onClick={toggleAdminMenu}
                variant="outline"
                className={`w-full mb-2 ${showAdminMenu ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'}`}
                size="sm"
              >
                {showAdminMenu ? (
                  <>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Switch to Attorney
                  </>
                ) : (
                  <>
                    <Shield className="mr-2 h-4 w-4" />
                    Switch to Admin
                  </>
                )}
              </Button>
            )}
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
