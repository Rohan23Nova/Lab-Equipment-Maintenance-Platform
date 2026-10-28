import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { DashboardPage } from '@/pages/analytics/DashboardPage';
import * as AuthContextModule from '@/context/AuthContext';
import { analyticsApi } from '@/lib/analyticsApi';
import { inventoryApi } from '@/lib/inventoryApi';
import { DashboardMetricsResponse } from '@/types/analytics';

describe('DashboardPage', () => {
  const sampleMetrics: DashboardMetricsResponse = {
    role: 'STAFF',
    totalActiveEquipment: 24,
    unavailableEquipment: 2,
    pendingReservations: 3,
    upcomingReservations: 7,
    openFaults: 4,
    criticalFaults: 1,
    activeWorkOrders: 5,
    overdueWorkOrders: 1,
    overallUtilizationPercentage: 68.5,
    totalCapacityHours: 1200.0,
    totalBookedHours: 822.0,
    meanTimeToRepairHours: 3.8,
    criticalActions: [
      {
        id: 'act-1',
        actionType: 'CRITICAL_FAULT',
        severity: 'CRITICAL',
        title: 'Critical Incident: Vacuum Failure',
        description: 'EQ-001 requires emergency pump replacement',
        targetUrl: '/app/faults/flt-1',
        createdAt: '2026-10-28T10:00:00Z',
      },
    ],
    incidentTrends: [
      { date: '2026-10-25', reportedFaults: 1, criticalFaults: 0, completedRepairs: 2 },
      { date: '2026-10-28', reportedFaults: 3, criticalFaults: 1, completedRepairs: 1 },
    ],
    topRepeatedFailures: [
      {
        equipmentId: 'eq-1',
        assetTag: 'EQ-PHYS-001',
        equipmentName: 'Rigaku XRD',
        laboratoryName: 'Materials Facility',
        status: 'UNDER_MAINTENANCE',
        faultCount: 3,
        criticalCount: 1,
        lastFaultDate: '2026-10-28T12:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'staff@university.edu',
        firstName: 'Sarah',
        lastName: 'Assistant',
        roles: ['ROLE_LAB_ASSISTANT'],
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

    vi.spyOn(inventoryApi, 'getLaboratories').mockResolvedValue([
      {
        id: 'lab-1',
        code: 'LAB-PHYS-01',
        name: 'Materials Characterization Facility',
        building: 'Science North',
        roomNumber: '101',
        active: true,
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]);

    vi.spyOn(analyticsApi, 'getDashboardMetrics').mockResolvedValue(sampleMetrics);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ThemeProvider>
          <DashboardPage />
        </ThemeProvider>
      </MemoryRouter>
    );

  it('renders dashboard with operational metrics and critical actions', async () => {
    renderComponent();

    await waitFor(() => {
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1.textContent).toContain('Operational Dashboard');
      expect(screen.getByText('Active Instruments')).toBeInTheDocument();
      expect(screen.getByText('24')).toBeInTheDocument();
      expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
      expect(screen.getAllByText('68.5%').length).toBeGreaterThanOrEqual(1);
    });

    // Critical action banner
    expect(screen.getByText('Critical Action Queue (1)')).toBeInTheDocument();
    expect(screen.getByText('Critical Incident: Vacuum Failure')).toBeInTheDocument();

    // Recurring failures table
    expect(screen.getByText(/Equipment with Recurring Incidents/)).toBeInTheDocument();
    expect(screen.getByText('EQ-PHYS-001')).toBeInTheDocument();
    expect(screen.getByText('Rigaku XRD')).toBeInTheDocument();
  });

  it('switches time range filter', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('7 Days')).toBeInTheDocument();
    });

    const sevenDaysBtn = screen.getByRole('button', { name: /7 days/i });
    await user.click(sevenDaysBtn);

    expect(analyticsApi.getDashboardMetrics).toHaveBeenCalled();
  });
});
