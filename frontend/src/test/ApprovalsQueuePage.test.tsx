import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ApprovalsQueuePage } from '@/pages/reservation/ApprovalsQueuePage';
import * as AuthContextModule from '@/context/AuthContext';
import { reservationApi } from '@/lib/reservationApi';
import { PageResponse } from '@/types/inventory';
import { ReservationSummary, Reservation } from '@/types/reservation';

describe('ApprovalsQueuePage', () => {
  const sampleApprovals: ReservationSummary[] = [
    {
      id: 'res-10',
      equipmentId: 'eq-100',
      equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
      equipmentAssetTag: 'EQ-PHYS-001',
      laboratoryName: 'Advanced Materials Characterization Facility',
      laboratoryCode: 'LAB-PHYS-01',
      userId: 'student-123',
      userFullName: 'Bob Smith',
      startTime: '2026-10-30T10:00:00Z',
      endTime: '2026-10-30T12:00:00Z',
      purpose: 'Powder diffraction of perovskites',
      status: 'PENDING',
      createdAt: '2026-10-28T12:00:00Z',
    },
    {
      id: 'res-11',
      equipmentId: 'eq-101',
      equipmentName: 'JEOL Field Emission Scanning Electron Microscope',
      equipmentAssetTag: 'EQ-PHYS-002',
      laboratoryName: 'Advanced Materials Characterization Facility',
      laboratoryCode: 'LAB-PHYS-01',
      userId: 'staff-456', // Same ID as logged-in user to test self-approval guard
      userFullName: 'Dr. Sarah Jenkins',
      startTime: '2026-10-31T14:00:00Z',
      endTime: '2026-10-31T16:00:00Z',
      purpose: 'Personal staff research calibration run',
      status: 'PENDING',
      createdAt: '2026-10-28T13:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<ReservationSummary> = {
    content: sampleApprovals,
    pageNumber: 0,
    pageSize: 15,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  const sampleApprovedReservation: Reservation = {
    id: 'res-10',
    equipmentId: 'eq-100',
    equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
    equipmentAssetTag: 'EQ-PHYS-001',
    laboratoryName: 'Advanced Materials Characterization Facility',
    laboratoryCode: 'LAB-PHYS-01',
    userId: 'student-123',
    userFullName: 'Bob Smith',
    userEmail: 'bob.smith@university.edu',
    startTime: '2026-10-30T10:00:00Z',
    endTime: '2026-10-30T12:00:00Z',
    purpose: 'Powder diffraction of perovskites',
    status: 'APPROVED',
    decisionByUserId: 'staff-456',
    decisionByUserName: 'Dr. Sarah Jenkins',
    decisionAt: '2026-10-28T14:00:00Z',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T14:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-456',
        email: 'sarah.jenkins@university.edu',
        firstName: 'Sarah',
        lastName: 'Jenkins',
        roles: ['ROLE_LAB_ASSISTANT'],
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

    vi.spyOn(reservationApi, 'getApprovalsQueue').mockResolvedValue(samplePageResponse);
    vi.spyOn(reservationApi, 'approveReservation').mockResolvedValue(sampleApprovedReservation);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <ApprovalsQueuePage />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders pending approvals queue with requesting users and instruments', async () => {
    renderComponent();

    expect(screen.getByText('Reservation Approvals Queue')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Sarah Jenkins')).toBeInTheDocument();
      expect(screen.getByText('Rigaku SmartLab X-Ray Diffractometer')).toBeInTheDocument();
      expect(screen.getByText('JEOL Field Emission Scanning Electron Microscope')).toBeInTheDocument();
    });
  });

  it('enforces self-approval guard: disables approve button for staff own request', async () => {
    renderComponent();

    await waitFor(() => {
      expect(
        screen.getByText(/Self-approval guard: As the requesting user, you cannot approve this booking/i)
      ).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole('button', { name: /Approve Booking/i });
    expect(approveButtons).toHaveLength(2);

    // Bob Smith's request (first) can be approved
    expect(approveButtons[0]).not.toBeDisabled();

    // Sarah Jenkins's own request (second) must be disabled due to self-approval guard
    expect(approveButtons[1]).toBeDisabled();
  });

  it('approves reservation when staff clicks Approve button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByRole('button', { name: /Approve Booking/i });
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(reservationApi.approveReservation).toHaveBeenCalledWith('res-10');
    });
  });

  it('opens reject modal when staff clicks Reject button', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /Reject/i })).toHaveLength(2);
    });

    const rejectButtons = screen.getAllByRole('button', { name: /Reject/i });
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Reject Reservation Request')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Mandatory laser recalibration scheduled/i)).toBeInTheDocument();
    });
  });
});
