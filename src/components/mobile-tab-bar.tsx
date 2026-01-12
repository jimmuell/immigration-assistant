"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bookmark, CheckCircle, Users, Shield, FileText, DollarSign, Briefcase, Send } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export function MobileTabBar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Using setTimeout to avoid direct setState in effect
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Don't render on auth pages or before mounting
  if (!isMounted || pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const tabs = [
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
      name: "Released",
      href: "/released",
      icon: Send,
      roles: ['client'],
    },
    {
      name: "Quotes",
      href: "/my-quotes",
      icon: DollarSign,
      roles: ['client'],
    },
    {
      name: "Dashboard",
      href: "/attorney",
      icon: Users,
      roles: ['attorney'],
    },
    {
      name: "New",
      href: "/attorney/new-screenings",
      icon: FileText,
      roles: ['attorney'],
    },
    {
      name: "Quotes",
      href: "/attorney/quotes",
      icon: DollarSign,
      roles: ['attorney'],
    },
    {
      name: "Cases",
      href: "/attorney/cases",
      icon: Briefcase,
      roles: ['attorney'],
    },
    {
      name: "Admin",
      href: "/admin",
      icon: Shield,
      roles: ['admin'],
    },
  ];

  // Filter tabs based on user role
  const userRole = session?.user?.role;
  const filteredTabs = tabs.filter(tab => 
    tab.roles.includes(userRole as 'client' | 'attorney' | 'admin')
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white shadow-lg md:hidden">
      <div className="flex items-center justify-around">
        {filteredTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === tab.href;
            
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-1 flex-col items-center gap-1 py-3 transition-colors ${
                  isActive
                    ? "text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className={`h-6 w-6 ${isActive ? "fill-current" : ""}`} />
                <span className="text-xs font-medium">{tab.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
  );
}
