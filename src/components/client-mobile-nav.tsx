"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Bookmark, CheckCircle, LogOut, User, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut, useSession } from "next-auth/react";

export function ClientMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render on auth pages or before mounting
  if (!isMounted || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  // Only show for clients
  if (session?.user?.role !== 'client') {
    return null;
  }

  const closeMenu = () => setIsOpen(false);

  const navItems = [
    {
      name: "Home",
      href: "/",
      icon: Home,
    },
    {
      name: "Saved Screenings",
      href: "/saved",
      icon: Bookmark,
    },
    {
      name: "Completed",
      href: "/completed",
      icon: CheckCircle,
    },
    {
      name: "Released",
      href: "/released",
      icon: Send,
    },
  ];

  return (
    <>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b bg-white px-4 py-3 shadow-sm md:hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-900">
              Immigration Assistant
            </h1>
            <p className="text-xs text-gray-600">
              Educational information about U.S. immigration
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="h-10 w-10 p-0"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={closeMenu}
          />
          
          {/* Menu Drawer */}
          <div className="fixed right-0 top-0 bottom-0 z-[70] w-72 bg-white shadow-xl md:hidden">
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3 flex-shrink-0 bg-blue-50">
                <div>
                  <h2 className="text-lg font-bold text-blue-900">Menu</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeMenu}
                  className="h-10 w-10 p-0"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>

              {/* User Info */}
              <div className="border-b bg-gradient-to-r from-blue-50 to-white px-4 py-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-600 truncate">
                      {session?.user?.email}
                    </p>
                    {session?.user?.organizationName && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {session.user.organizationName}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto min-h-0">
                <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Navigation
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenu}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-manipulation ${
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

              {/* Logout */}
              <div className="border-t px-3 py-4 flex-shrink-0 bg-white">
                <Button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  variant="outline"
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 touch-manipulation py-3"
                  size="default"
                >
                  <LogOut className="mr-2 h-5 w-5" />
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

