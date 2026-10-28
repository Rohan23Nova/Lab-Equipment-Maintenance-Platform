import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationItem } from '@/types/notification';
import { PageResponse } from '@/types/inventory';
import { NotificationCard } from '@/components/notification/NotificationCard';
import { NotificationPreferencesModal } from '@/components/notification/NotificationPreferencesModal';
import {
  Bell,
  CheckCheck,
  Settings,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notificationsData, setNotificationsData] = useState<PageResponse<NotificationItem>>({
    content: [],
    pageNumber: 0,
    pageSize: 15,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  });
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await notificationApi.getNotifications({
        unreadOnly,
        page: currentPage,
        size: 15,
      });
      setNotificationsData(data);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, [unreadOnly, currentPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotificationsData((prev) => ({
        ...prev,
        content: prev.content.map((n) => ({ ...n, isRead: true })),
      }));
    } catch {
      // Graceful error
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationApi.markAsRead(id);
      setNotificationsData((prev) => ({
        ...prev,
        content: prev.content.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      }));
    } catch {
      // Graceful error
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <Bell className="w-6 h-6 text-accent-lime" />
              Notifications Ledger
            </h1>
            <p className="text-sm text-muted-foreground">
              Institutional notices, reservation scheduling decisions, and equipment maintenance dispatches.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreferencesOpen(true)}
              className="gap-1.5"
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>Preferences</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="gap-1.5"
            >
              <CheckCheck className="w-4 h-4 text-accent-lime" />
              <span>Mark All Read</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNotifications}
              title="Refresh notifications"
              className="px-2.5"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent-lime' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => {
                setUnreadOnly(false);
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                !unreadOnly
                  ? 'bg-muted text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All Notifications
            </button>
            <button
              onClick={() => {
                setUnreadOnly(true);
                setCurrentPage(0);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                unreadOnly
                  ? 'bg-muted text-foreground border border-border shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Unread Only
            </button>
          </div>

          <span className="text-xs text-muted-foreground">
            Total records: <strong className="text-foreground">{notificationsData.totalElements}</strong>
          </span>
        </div>

        {/* List Content */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-sm">Fetching notification ledger...</p>
          </div>
        ) : notificationsData.content.length === 0 ? (
          <div className="py-20 text-center rounded-xl border border-dashed border-border bg-card p-8">
            <Bell className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No notifications found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {unreadOnly
                ? 'You have zero unread notifications. Toggle to view past history.'
                : 'No alerts or maintenance events have been dispatched to your account.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notificationsData.content.map((item) => (
              <NotificationCard
                key={item.id}
                notification={item}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {notificationsData.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-xs text-muted-foreground">
              Page {notificationsData.pageNumber + 1} of {notificationsData.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={notificationsData.pageNumber === 0}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={notificationsData.last}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="gap-1"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </main>

      <Footer />

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  );
};
