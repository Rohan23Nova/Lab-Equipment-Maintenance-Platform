import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { MyReservationsPage } from '@/pages/reservation/MyReservationsPage';
import * as AuthContextModule from '@/context/AuthContext';
import { reservationApi } from '@/lib/reservationApi';
import { PageResponse } from '@/types/inventory';
import { ReservationSummary } from '@/types/reservation';

describe('MyReservationsPage', () => {
  const sampleReservations: ReservationSummary[] = [
    {
      id: 'res-1',
      equipmentId: 'eq-100',
      equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
      equipmentAssetTag: 'EQ-PHYS-001',
      laboratoryName: 'Advanced Materials Characterization Facility',
      laboratoryCode: 'LAB-PHYS-01',
      userId: 'user-1',
      userFullName: 'Alice Johnson',
      startTime: '2026-10-30T10:00:00Z',
      endTime: '2026-10-30T12:00:00Z',
      purpose: 'Thin-film analysis',
      status: 'APPROVED',
      createdAt: '2026-10-28T12:00:00Z',
    },
    {
      id: 'res-2',
      equipmentId: 'eq-101',
      equipmentName: 'JEOL Field Emission Scanning Electron Microscope',
      equipmentAssetTag: 'EQ-PHYS-002',
      laboratoryName: 'Advanced Materials Characterization Facility',
      laboratoryCode: 'LAB-PHYS-01',
      userId: 'user-1',
      userFullName: 'Alice Johnson',
      startTime: '2026-10-31T14:00:00Z',
      endTime: '2026-10-31T16:00:00Z',
      purpose: 'Nanowire morphology mapping',
      status: 'PENDING',
      createdAt: '2026-10-28T13:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<ReservationSummary> = {
    content: sampleReservations,
    pageNumber: 0,
    pageSize: 10,
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
        email: 'alice.johnson@university.edu',
        firstName: 'Alice',
        lastName: 'Johnson',
        roles: ['ROLE_STUDENT'],
        department: 'Physics',
        status: 'ACTIVE',
        createdAt: '2026-10-28T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(reservationApi, 'getMyReservations').mockResolvedValue(samplePageResponse);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <MyReservationsPage />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders user reservations list and headers', async () => {
    renderComponent();

    expect(screen.getByText('My Instrument Reservations')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Rigaku SmartLab X-Ray Diffractometer')).toBeInTheDocument();
      expect(screen.getByText('JEOL Field Emission Scanning Electron Microscope')).toBeInTheDocument();
      expect(screen.getByText('EQ-PHYS-001')).toBeInTheDocument();
      expect(screen.getByText('EQ-PHYS-002')).toBeInTheDocument();
    });
  });

  it('filters by status when clicking status tabs', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(reservationApi.getMyReservations).toHaveBeenCalledWith(undefined, 0, 10);
    });

    const pendingTab = screen.getByRole('button', { name: /Pending Approval/i });
    await user.click(pendingTab);

    await waitFor(() => {
      expect(reservationApi.getMyReservations).toHaveBeenCalledWith('PENDING', 0, 10);
    });
  });

  it('opens cancellation dialog when clicking Cancel button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /^Cancel$/i })).toHaveLength(2);
    });

    const cancelBtns = screen.getAllByRole('button', { name: /^Cancel$/i });
    await user.click(cancelBtns[0]);

    await waitFor(() => {
      expect(screen.getByText('Cancel Scheduled Reservation')).toBeInTheDocument();
      expect(screen.getByText(/This slot will be immediately released/i)).toBeInTheDocument();
    });
  });
});
