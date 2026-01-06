"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Shield, UserCog, GitBranch, ClipboardList, LogOut, Briefcase, FlaskConical, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

export function AdminMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    {
      name: "Admin Dashboard",
      href: "/admin",
      icon: Shield,
    },
    {
      name: "Attorney Dashboard",
      href: "/attorney",
      icon: Briefcase,
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: UserCog,
    },
    {
      name: "Flows",
      href: "/admin/flows",
      icon: GitBranch,
    },
    {
      name: "Screenings",
      href: "/admin/intakes",
      icon: ClipboardList,
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
    },
    {
      name: "Test Screenings",
      href: "/test-screenings",
      icon: FlaskConical,
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const scrollDifference = Math.abs(currentScrollY - lastScrollY.current);
          
          // Only update if scrolled more than 5px to avoid jitter
          if (scrollDifference < 5) {
            ticking.current = false;
            return;
          }
          
          if (currentScrollY < 10) {
            // Always show header at top of page
            setIsVisible(true);
          } else if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
            // Scrolling down - hide header (only after 80px)
            setIsVisible(false);
            setIsOpen(false); // Close menu when hiding
          } else if (currentScrollY < lastScrollY.current) {
            // Scrolling up - show header
            setIsVisible(true);
          }
          
          lastScrollY.current = currentScrollY;
          ticking.current = false;
        });
        
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut({ callbackUrl: "/login" });
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div 
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b bg-white px-4 py-3 md:hidden transition-transform duration-300 ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div>
          <h2 className="text-lg font-bold text-blue-900">Immigration Assistant</h2>
          <p className="text-xs text-gray-600">AI-powered guidance</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleMenu}
          className="h-10 w-10 p-0"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[60px] md:hidden" />

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeMenu}
          />
          
          {/* Menu Drawer */}
          <div className="fixed right-0 top-0 bottom-16 z-50 w-64 bg-white shadow-xl md:hidden overflow-hidden">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-blue-900">Menu</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="h-10 w-10 p-0"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-blue-100 text-blue-900"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-blue-600" : ""}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              {/* User Info & Logout */}
              <div className="border-t px-3 py-4 flex-shrink-0">
                <div className="mb-3 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name || "User"}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{session?.user?.email}</p>
                  <p className="text-xs text-blue-600 font-medium capitalize mt-1">
                    {session?.user?.role || "admin"}
                  </p>
                  {session?.user?.organizationName && (
                    <p className="text-xs text-gray-500 truncate mt-1 border-t pt-1">
                      {session.user.organizationName}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
