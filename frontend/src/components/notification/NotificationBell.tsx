import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Settings, ExternalLink } from 'lucide-react';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationItem } from '@/types/notification';
import { NotificationCard } from '@/components/notification/NotificationCard';
import { NotificationPreferencesModal } from '@/components/notification/NotificationPreferencesModal';

export const NotificationBell: React.FC = () => {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchUnreadCount = async () => {
    try {
      const count = await notificationApi.getUnreadCount();
      setUnreadCount(count);
    } catch {
      // Graceful fallback without crashing header
    }
  };

  const fetchRecent = async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications({ page: 0, size: 5 });
      setRecentNotifications(data.content);
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Refresh count on window focus
    const onFocus = () => fetchUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  // When dropdown opens, fetch latest recent items
  useEffect(() => {
    if (isOpen) {
      fetchRecent();
      fetchUnreadCount();
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Error handling
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setUnreadCount((c) => Math.max(0, c - 1));
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Error handling
    }
  };

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-lime px-1 text-[10px] font-bold text-ink-950 ring-2 ring-background animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card shadow-elevation-3 z-50 overflow-hidden text-card-foreground animate-in fade-in slide-in-from-top-2"
          role="region"
          aria-label="Notification center popover"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3.5 border-b border-border/80 bg-muted/20">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent-lime/20 text-accent-lime border border-accent-lime/30">
                  {unreadCount} unread
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                  title="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-accent-lime" />
                  <span className="text-[11px]">Mark read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPreferencesOpen(true);
                }}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Notification preferences"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40 p-2 space-y-1.5">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-1">
                <Bell className="w-6 h-6 mx-auto text-muted-foreground/40 mb-1" />
                <p className="font-medium text-foreground">No notifications</p>
                <p>You are completely caught up on lab alerts.</p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <NotificationCard
                  key={n.id}
                  notification={n}
                  onMarkRead={handleMarkRead}
                  onNavigate={() => setIsOpen(false)}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-border/80 bg-muted/20 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/app/notifications');
              }}
              className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 focus:outline-none"
            >
              <span>View full ledger</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <span className="text-[10px] text-muted-foreground">Updated in real-time</span>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
};
