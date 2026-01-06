"use client";

import { NotificationDropdown } from "@/components/notification-dropdown";

interface DashboardHeaderProps {
  userName?: string;
  greeting?: string;
}

export function DashboardHeader({ userName, greeting }: DashboardHeaderProps) {
  const getGreeting = () => {
    if (greeting) return greeting;
    
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-3xl font-bold">
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
