import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationsPage } from '@/pages/notification/NotificationsPage';
import * as AuthContextModule from '@/context/AuthContext';
import { notificationApi } from '@/lib/notificationApi';
import { NotificationItem } from '@/types/notification';
import { PageResponse } from '@/types/inventory';

describe('NotificationsPage', () => {
  const sampleNotifications: NotificationItem[] = [
    {
      id: 'notif-1',
      recipientId: 'user-1',
      type: 'RESERVATION_APPROVED',
      title: 'Reservation Approved',
      message: 'Your slot for Rigaku XRD has been confirmed.',
      navigationTarget: '/app/reservations',
      isRead: false,
      channel: 'IN_APP',
      createdAt: '2026-10-28T14:00:00Z',
    },
    {
      id: 'notif-2',
      recipientId: 'user-1',
      type: 'FAULT_REPORTED',
      title: 'Fault Incident Reported',
      message: 'A defect was reported on Scanning Electron Microscope.',
      navigationTarget: '/app/faults/flt-1',
      isRead: true,
      channel: 'IN_APP',
      createdAt: '2026-10-28T13:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<NotificationItem> = {
    content: sampleNotifications,
    pageNumber: 0,
    pageSize: 15,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'alice@university.edu',
        firstName: 'Alice',
        lastName: 'Johnson',
        roles: ['ROLE_STUDENT'],
        department: 'Physics',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(notificationApi, 'getNotifications').mockResolvedValue(samplePageResponse);
    vi.spyOn(notificationApi, 'getUnreadCount').mockResolvedValue(1);
    vi.spyOn(notificationApi, 'markAllAsRead').mockResolvedValue(2);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ThemeProvider>
          <NotificationsPage />
        </ThemeProvider>
      </MemoryRouter>
    );

  it('renders notifications ledger with items', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Notifications Ledger')).toBeInTheDocument();
      expect(screen.getByText('Reservation Approved')).toBeInTheDocument();
      expect(screen.getByText('Fault Incident Reported')).toBeInTheDocument();
    });
  });

  it('switches between all and unread filter tabs', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('All Notifications')).toBeInTheDocument();
    });

    const unreadTab = screen.getByRole('button', { name: /unread only/i });
    await user.click(unreadTab);

    expect(notificationApi.getNotifications).toHaveBeenCalledWith(
      expect.objectContaining({ unreadOnly: true })
    );
  });

  it('marks all as read when header button clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /mark all read/i })).toBeInTheDocument();
    });

    const markAllBtn = screen.getByRole('button', { name: /mark all read/i });
    await user.click(markAllBtn);

    expect(notificationApi.markAllAsRead).toHaveBeenCalled();
  });
});
