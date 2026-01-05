"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const DesktopSidebar = dynamic(
  () => import("@/components/desktop-sidebar").then((mod) => ({ default: mod.DesktopSidebar })),
  { 
    ssr: false,
    loading: () => null
  }
);

const MobileTabBar = dynamic(
  () => import("@/components/mobile-tab-bar").then((mod) => ({ default: mod.MobileTabBar })),
  { 
    ssr: false,
    loading: () => null
  }
);

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Pages that should not have sidebar/navigation
  const publicPages = [
    "/landing",
    "/login",
    "/signup",
    "/admin/attorneys/onboard"
  ];

  const isPublicPage = publicPages.some(page => pathname?.startsWith(page));

  // If it's a public page, just render children without sidebar
  if (isPublicPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <DesktopSidebar />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      <MobileTabBar />
    </div>
  );
}

