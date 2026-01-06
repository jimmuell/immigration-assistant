"use client";

import { useState, useEffect } from "react";
import { Bell, FileText, DollarSign, CheckCircle, X, AlertCircle, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, markNotificationAsRead, markNotificationAsUnread, dismissNotification, type Notification } from "@/app/notifications/actions";
import Link from "next/link";
import { toast } from "sonner";

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
      if (e) toast.success("Marked as read");
    } catch (error) {
      toast.error("Failed to mark as read");
    }
  };

  const handleMarkAsUnread = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await markNotificationAsUnread(notificationId);
      await loadNotifications();
      toast.success("Marked as unread");
    } catch (error) {
      toast.error("Failed to mark as unread");
    }
  };

  const handleDismiss = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await dismissNotification(notificationId);
      await loadNotifications();
      toast.success("Notification dismissed");
    } catch (error) {
      toast.error("Failed to dismiss notification");
    }
  };

  const getIcon = (icon: Notification['icon']) => {
    switch (icon) {
      case 'screening':
        return <FileText className="h-4 w-4" />;
      case 'quote':
        return <DollarSign className="h-4 w-4" />;
      case 'check':
        return <CheckCircle className="h-4 w-4" />;
      case 'x':
        return <X className="h-4 w-4" />;
      case 'alert':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'new_screening':
        return 'bg-blue-100 text-blue-600';
      case 'quote_received':
        return 'bg-purple-100 text-purple-600';
      case 'pending_quote':
        return 'bg-yellow-100 text-yellow-600';
      case 'quote_accepted':
        return 'bg-green-100 text-green-600';
      case 'quote_declined':
        return 'bg-red-100 text-red-600';
      case 'needs_assignment':
        return 'bg-orange-100 text-orange-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-gray-100">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-[420px] p-0 bg-white border shadow-lg"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
          {notifications.length > 0 && (
            <span className="text-xs text-gray-500">
              {notifications.length} {notifications.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto bg-white">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500 bg-white">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center bg-white">
              <Bell className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-sm font-medium text-gray-900 mb-1">No notifications</p>
              <p className="text-xs text-gray-500">
                You're all caught up!
              </p>
            </div>
          ) : (
            <div className="divide-y bg-white">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`relative group hover:bg-blue-50 transition-colors bg-white ${
                    !notification.isRead ? 'bg-blue-50/30' : ''
                  }`}
                >
                  {/* Unread indicator */}
                  {!notification.isRead && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-600 rounded-full" />
                  )}
                  
                  <Link
                    href={notification.link}
                    onClick={() => setIsOpen(false)}
                    className="block"
                  >
                    <div className="flex gap-3 p-4 pl-6">
                      <div className={`flex-shrink-0 rounded-full p-2 ${getIconColor(notification.type)}`}>
                        {getIcon(notification.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm mb-1 ${
                          notification.isRead ? 'font-normal text-gray-900' : 'font-semibold text-gray-900'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Action buttons - show on hover */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm rounded p-1">
                    {notification.isRead ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-100"
                        onClick={(e) => handleMarkAsUnread(notification.id, e)}
                        title="Mark as unread (keeps notification)"
                      >
                        <Mail className="h-4 w-4 text-gray-600" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-blue-100"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        title="Mark as read (keeps notification)"
                      >
                        <Check className="h-4 w-4 text-blue-600" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-red-100"
                      onClick={(e) => handleDismiss(notification.id, e)}
                      title="Delete notification"
                    >
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t p-2 bg-gray-50">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => {
                setIsOpen(false);
                // Could navigate to a full notifications page
              }}
            >
              View All Notifications
            </Button>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

