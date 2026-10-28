import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ProblemDetail } from '@/types/api';
import { ApiClientError } from '@/lib/apiClient';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationPreferences, UpdatePreferencesPayload } from '@/types/notification';
import { Bell, Mail, Clock, AlertTriangle, Wrench, X, Check, Settings2 } from 'lucide-react';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (preferences: NotificationPreferences) => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [preferences, setPreferences] = useState<UpdatePreferencesPayload>({
    emailEnabled: true,
    inAppEnabled: true,
    reservationReminders: true,
    reminderLeadHours: 2,
    maintenanceUpdates: true,
    faultAlerts: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ProblemDetail | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setError(null);
      setSavedSuccess(false);
      notificationApi
        .getPreferences()
        .then((data) => {
          setPreferences({
            emailEnabled: data.emailEnabled,
            inAppEnabled: data.inAppEnabled,
            reservationReminders: data.reservationReminders,
            reminderLeadHours: data.reminderLeadHours,
            maintenanceUpdates: data.maintenanceUpdates,
            faultAlerts: data.faultAlerts,
          });
        })
        .catch((err) => {
          if (err instanceof ApiClientError) {
            setError(err.problem);
          } else {
            setError({
              title: 'Failed to load preferences',
              status: 500,
              detail: 'Unable to retrieve your notification settings. Please try again.',
            });
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    setSavedSuccess(false);

    try {
      const updated = await notificationApi.updatePreferences(preferences);
      setSavedSuccess(true);
      if (onSuccess) {
        onSuccess(updated);
      }
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.problem);
      } else {
        setError({
          title: 'Update Failed',
          status: 500,
          detail: 'Failed to save notification preferences. Please try again.',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-preferences-title"
    >
      <div className="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-lime/10 border border-accent-lime/20 text-accent-lime">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="notification-preferences-title" className="text-lg font-semibold text-foreground">
                Notification Preferences
              </h2>
              <p className="text-xs text-muted-foreground">
                Configure delivery channels and automated alerts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            <p className="font-semibold">{error.title}</p>
            <p className="text-xs mt-0.5">{error.detail}</p>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin text-accent-lime" />
            <p className="text-xs">Loading preferences...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5">
            {/* Delivery Channels */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Delivery Channels
              </h3>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">
                        Receive important updates and reservation outcomes via email
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.emailEnabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, emailEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-accent-lime"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-accent-lime" />
                    <div>
                      <p className="text-sm font-medium text-foreground">In-App Notification Center</p>
                      <p className="text-xs text-muted-foreground">
                        Display unread badges and drop-down ledger alerts in portal
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.inAppEnabled}
                    onChange={(e) =>
                      setPreferences({ ...preferences, inAppEnabled: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-accent-lime"
                  />
                </label>
              </div>
            </div>

            {/* Notification Categories */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Alert Subscriptions
              </h3>

              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-accent-lime" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Upcoming Reservation Reminders
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Automated background reminder before scheduled slot begins
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.reservationReminders}
                      onChange={(e) =>
                        setPreferences({ ...preferences, reservationReminders: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-border text-primary focus:ring-accent-lime"
                    />
                  </label>

                  {preferences.reservationReminders && (
                    <div className="pl-7 pt-2 border-t border-border/40 flex items-center justify-between">
                      <label
                        htmlFor="lead-time"
                        className="text-xs font-medium text-muted-foreground"
                      >
                        Reminder Lead Time
                      </label>
                      <select
                        id="lead-time"
                        value={preferences.reminderLeadHours}
                        onChange={(e) =>
                          setPreferences({
                            ...preferences,
                            reminderLeadHours: Number(e.target.value),
                          })
                        }
                        className="text-xs rounded-md border border-border bg-card px-2.5 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-accent-lime"
                      >
                        <option value={1}>1 hour before</option>
                        <option value={2}>2 hours before</option>
                        <option value={4}>4 hours before</option>
                        <option value={12}>12 hours before</option>
                        <option value={24}>24 hours before</option>
                        <option value={48}>48 hours before</option>
                      </select>
                    </div>
                  )}
                </div>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Equipment Fault Alerts</p>
                      <p className="text-xs text-muted-foreground">
                        Notices when equipment you reserved or oversee experiences a reported defect
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.faultAlerts}
                    onChange={(e) =>
                      setPreferences({ ...preferences, faultAlerts: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-accent-lime"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-lg border border-border/80 bg-background/50 hover:bg-muted/30 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-accent-lime" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Work Order & Maintenance Updates
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Assignment, progress milestones, and return-to-service notices
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.maintenanceUpdates}
                    onChange={(e) =>
                      setPreferences({ ...preferences, maintenanceUpdates: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-border text-primary focus:ring-accent-lime"
                  />
                </label>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/80">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="gap-1.5"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-accent-lime" />
                    <span>Preferences Saved</span>
                  </>
                ) : isSaving ? (
                  <span>Saving...</span>
                ) : (
                  <span>Save Preferences</span>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
