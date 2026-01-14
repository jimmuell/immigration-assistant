"use client";

import { NotificationDropdown } from "@/components/notification-dropdown";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ReactNode } from "react";

interface DashboardHeaderProps {
  userName?: string;
  greeting?: string;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  backLink?: string;
  backLabel?: string;
}

export function DashboardHeader({ userName, greeting, title, subtitle, icon, backLink, backLabel }: DashboardHeaderProps) {
  const getGreeting = () => {
    if (greeting) return greeting;

    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  // If title is provided, show title/subtitle mode
  if (title) {
    return (
      <div className="space-y-4">
        {backLink && (
          <div className="flex items-center gap-4">
            <Link href={backLink}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backLabel || "Back"}
              </Button>
            </Link>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              {icon}
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
            )}
          </div>
          <NotificationDropdown />
        </div>
      </div>
    );
  }

  // Default greeting mode
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl md:text-3xl font-bold">
        {getGreeting()}{" "}
        {userName && (
          <span className="text-blue-600">{userName}</span>
        )}{" "}
        <span className="inline-block">👋</span>
      </h1>
      <NotificationDropdown />
    </div>
  );
}
