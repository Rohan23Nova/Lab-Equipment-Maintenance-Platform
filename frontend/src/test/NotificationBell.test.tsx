import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationItem } from '@/types/notification';
import { PageResponse } from '@/types/inventory';

describe('NotificationBell', () => {
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      recipientId: 'user-1',
      type: 'RESERVATION_APPROVED',
      title: 'Reservation Approved',
      message: 'Your reservation for Rigaku XRD has been approved.',
      navigationTarget: '/app/reservations',
      isRead: false,
      channel: 'IN_APP',
      createdAt: '2026-10-28T14:00:00Z',
    },
    {
      id: 'notif-2',
      recipientId: 'user-1',
      type: 'RESERVATION_REMINDER',
      title: 'Upcoming Reservation',
      message: 'Your reservation starts in 2 hours.',
      navigationTarget: '/app/reservations',
      isRead: true,
      channel: 'IN_APP',
      createdAt: '2026-10-28T12:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<NotificationItem> = {
    content: sampleNotifications,
    pageNumber: 0,
    pageSize: 5,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(notificationApi, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue(samplePageResponse);
    vi.spyOn(notificationApi, 'markAsRead').mockResolvedValue({
      ...sampleNotifications[0],
      isRead: true,
    });
    vi.spyOn(notificationApi, 'markAllAsRead').mockResolvedValue(1);
  });

  it('renders unread count badge when there are unread notifications', async () => {
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('opens popover when bell button is clicked and lists notifications', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Notifications')).toBeInTheDocument();
      expect(screen.getByText('Reservation Approved')).toBeInTheDocument();
      expect(screen.getByText(/Rigaku XRD/)).toBeInTheDocument();
    });
  });

  it('marks all as read when mark read action is clicked', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <NotificationBell />
      </MemoryRouter>
    );

    const button = screen.getByRole('button', { name: /view notifications/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Mark read')).toBeInTheDocument();
    });

    const markAllBtn = screen.getByText('Mark read');
    await user.click(markAllBtn);

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
  });
});
