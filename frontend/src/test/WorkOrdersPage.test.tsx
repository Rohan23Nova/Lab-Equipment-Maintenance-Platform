import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { WorkOrdersPage } from '@/pages/maintenance/WorkOrdersPage';
import * as AuthContextModule from '@/context/AuthContext';
import { maintenanceApi } from '@/lib/maintenanceApi';
import { PageResponse } from '@/types/inventory';
import { MaintenanceWorkOrderSummary } from '@/types/maintenance';

vi.mock('@/lib/maintenanceApi', () => ({
  maintenanceApi: {
    findWorkOrders: vi.fn(),
    getTechnicianTasks: vi.fn(),
    startWorkOrder: vi.fn(),
  },
}));

describe('WorkOrdersPage', () => {
  const sampleWorkOrders: MaintenanceWorkOrderSummary[] = [
    {
      id: 'wo-1',
      workOrderNumber: 'WO-2026-0001',
      equipmentId: 'eq-100',
      equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
      equipmentAssetTag: 'EQ-PHYS-001',
      laboratoryName: 'Materials Lab',
      assignedTechnicianId: 'tech-1',
      assignedTechnicianName: 'Bob Technician',
      title: 'X-Ray chiller circulation pump seal overhaul',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      passedInspection: false,
      createdAt: '2026-10-28T11:00:00Z',
    },
    {
      id: 'wo-2',
      workOrderNumber: 'WO-2026-0002',
      equipmentId: 'eq-102',
      equipmentName: 'Thermo Fisher Orbitrap Exploris',
      equipmentAssetTag: 'EQ-BIO-001',
      laboratoryName: 'Proteomics Core',
      assignedTechnicianId: 'tech-2',
      assignedTechnicianName: 'David Tech',
      title: 'Turbo pump roughing valve replacement',
      priority: 'URGENT',
      status: 'COMPLETED',
      passedInspection: false,
      createdAt: '2026-10-27T09:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<MaintenanceWorkOrderSummary> = {
    content: sampleWorkOrders,
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
        id: 'tech-1',
        email: 'technician@university.edu',
        firstName: 'Bob',
        lastName: 'Technician',
        roles: ['ROLE_TECHNICIAN'],
        department: 'Engineering Services',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.mocked(maintenanceApi.findWorkOrders).mockResolvedValue(samplePageResponse);
    vi.mocked(maintenanceApi.getTechnicianTasks).mockResolvedValue({
      ...samplePageResponse,
      content: [sampleWorkOrders[0]],
      totalElements: 1,
    });
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ThemeProvider>
          <WorkOrdersPage />
        </ThemeProvider>
      </MemoryRouter>
    );
  };

  it('renders work orders ledger with active jobs', async () => {
    renderComponent();

    expect(screen.getByText(/Maintenance Work Orders/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
      expect(
        screen.getByText('X-Ray chiller circulation pump seal overhaul')
      ).toBeInTheDocument();
      expect(screen.getByText('WO-2026-0002')).toBeInTheDocument();
    });

    expect(screen.getByText(/2 Active/i)).toBeInTheDocument();
  });

  it('switches to My Assigned Tasks tab for technician user', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('WO-2026-0001')).toBeInTheDocument();
    });

    const myTasksTab = screen.getByRole('button', { name: /My Assigned Tasks/i });
    await user.click(myTasksTab);

    await waitFor(() => {
      expect(maintenanceApi.getTechnicianTasks).toHaveBeenCalled();
    });
  });
});
