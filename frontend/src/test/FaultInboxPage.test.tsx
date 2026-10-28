import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { FaultInboxPage } from '@/pages/maintenance/FaultInboxPage';
import * as AuthContextModule from '@/context/AuthContext';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { PageResponse } from '@/types/inventory';
import { FaultReportSummary } from '@/types/maintenance';

vi.mock('@/lib/maintenanceApi', () => ({
  maintenanceApi: {
    findFaults: vi.fn(),
    triageFault: vi.fn(),
  },
}));

describe('FaultInboxPage', () => {
  const sampleFaults: FaultReportSummary[] = [
    {
      id: 'fault-1',
      faultNumber: 'FLT-2026-0001',
      equipmentId: 'eq-100',
      equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
      equipmentAssetTag: 'EQ-PHYS-001',
      laboratoryName: 'Materials Lab',
      reportedById: 'user-1',
      reportedByName: 'Alice Student',
      title: 'Cooling fluid leakage under high voltage chiller',
      severity: 'CRITICAL',
      status: 'OPEN',
      reportedAt: '2026-10-28T10:00:00Z',
      createdAt: '2026-10-28T10:00:00Z',
    },
    {
      id: 'fault-2',
      faultNumber: 'FLT-2026-0002',
      equipmentId: 'eq-101',
      equipmentName: 'Agilent 1260 Infinity HPLC',
      equipmentAssetTag: 'EQ-CHEM-002',
      laboratoryName: 'Chromatography Suite',
      reportedById: 'user-2',
      reportedByName: 'Bob Chemist',
      title: 'Column pressure fluctuating past 350 bar',
      severity: 'MEDIUM',
      status: 'IN_REPAIR',
      reportedAt: '2026-10-27T15:30:00Z',
      createdAt: '2026-10-27T15:30:00Z',
    },
  ];

  const samplePageResponse: PageResponse<FaultReportSummary> = {
    content: sampleFaults,
    pageNumber: 0,
    pageSize: 15,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'staff-1',
        email: 'assistant@university.edu',
        firstName: 'Sarah',
        lastName: 'Assistant',
        roles: ['ROLE_LAB_ASSISTANT'],
        department: 'Physics',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(maintenanceApi.findFaults).mockResolvedValue(samplePageResponse);
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <FaultInboxPage />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders fault reports ledger with header and records', async () => {
    renderComponent();

    expect(screen.getByText(/Fault Reports Ledger/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('FLT-2026-0001')).toBeInTheDocument();
      expect(
        screen.getByText('Cooling fluid leakage under high voltage chiller')
      ).toBeInTheDocument();
      expect(screen.getByText('FLT-2026-0002')).toBeInTheDocument();
      expect(
        screen.getByText('Column pressure fluctuating past 350 bar')
      ).toBeInTheDocument();
    });

    expect(screen.getByText(/2 Records/i)).toBeInTheDocument();
  });

  it('renders triage action button for staff on OPEN faults', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('FLT-2026-0001')).toBeInTheDocument();
    });

    // OPEN fault FLT-2026-0001 should have "Triage Report" button
    const triageButtons = screen.getAllByRole('button', { name: /Triage Report/i });
    expect(triageButtons.length).toBeGreaterThan(0);
  });

  it('filters faults by search input', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('FLT-2026-0001')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search by fault number/i);
    await user.type(searchInput, 'chiller');

    await waitFor(() => {
      expect(maintenanceApi.findFaults).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'chiller',
        })
      );
    });
  });
});
