import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationPreferencesModal } from '@/components/notification/NotificationPreferencesModal';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationPreferences } from '@/types/notification';

describe('NotificationPreferencesModal', () => {
  const samplePrefs: NotificationPreferences = {
    emailEnabled: true,
    inAppEnabled: true,
    reservationReminders: true,
    reminderLeadHours: 2,
    maintenanceUpdates: true,
    faultAlerts: true,
    updatedAt: '2026-10-28T12:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notificationApi, 'getPreferences').mockResolvedValue(samplePrefs);
    vi.spyOn(notificationApi, 'updatePreferences').mockResolvedValue(samplePrefs);
  });

  it('loads and renders preferences when open', async () => {
    render(
      <NotificationPreferencesModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
      expect(screen.getByText('Email Notifications')).toBeInTheDocument();
      expect(screen.getByText('In-App Notification Center')).toBeInTheDocument();
      expect(screen.getByText('Upcoming Reservation Reminders')).toBeInTheDocument();
    });
  });

  it('submits updated preferences successfully', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <NotificationPreferencesModal
        isOpen={true}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Notification Preferences')).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole('button', { name: /save preferences/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(notificationApi.updatePreferences).toHaveBeenCalledWith({
        emailEnabled: true,
        inAppEnabled: true,
        reservationReminders: true,
        reminderLeadHours: 2,
        maintenanceUpdates: true,
        faultAlerts: true,
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
