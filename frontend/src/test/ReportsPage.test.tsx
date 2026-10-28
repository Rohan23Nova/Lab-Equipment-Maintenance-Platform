import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { ReportsPage } from '@/pages/analytics/ReportsPage';
import * as AuthContextModule from '@/context/AuthContext';
import { analyticsApi } from '@/lib/analyticsApi';
import { inventoryApi } from '@/lib/inventoryApi';
import {
  InventoryDistributionReport,
  OverdueWorkOrderReport,
} from '@/types/analytics';

describe('ReportsPage', () => {
  const sampleInventory: InventoryDistributionReport = {
    totalActive: 18,
    totalArchived: 2,
    totalPurchaseCost: 450000.0,
    byCategory: { Spectrometry: 8, Microscopy: 10 },
    byStatus: { AVAILABLE: 15, UNDER_MAINTENANCE: 3 },
    byCondition: { EXCELLENT: 12, GOOD: 6 },
    byLaboratory: { 'Materials Facility': 18 },
  };

  const sampleOverdue: OverdueWorkOrderReport[] = [
    {
      workOrderId: 'wo-1',
      workOrderNumber: 'WO-2026-042',
      title: 'Optic recalibration',
      equipmentAssetTag: 'EQ-OPT-001',
      equipmentName: 'Laser Interferometer',
      laboratoryName: 'Photonics Wing',
      assignedTechnicianName: 'Marcus Tech',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      plannedCompletionDate: '2026-10-15',
      daysOverdue: 13,
    },
  ];

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

    vi.spyOn(inventoryApi, 'getLaboratories').mockResolvedValue([]);
    vi.spyOn(analyticsApi, 'getInventoryReport').mockResolvedValue(sampleInventory);
    vi.spyOn(analyticsApi, 'getOverdueMaintenanceReport').mockResolvedValue(sampleOverdue);
    vi.spyOn(analyticsApi, 'getExportUrl').mockReturnValue('/api/v1/analytics/reports/export/inventory');
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ThemeProvider>
          <ReportsPage />
        </ThemeProvider>
      </MemoryRouter>
    );

  it('renders reports page with active assets and capital valuation', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Institutional Reports & Auditing')).toBeInTheDocument();
      expect(screen.getByText('Active Assets')).toBeInTheDocument();
      expect(screen.getByText('18')).toBeInTheDocument();
      expect(screen.getByText('Spectrometry')).toBeInTheDocument();
      expect(screen.getByText('Microscopy')).toBeInTheDocument();
    });

    // CSV export button is available
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('switches to overdue maintenance tab and displays overdue work orders', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/4. Overdue Work Orders/)).toBeInTheDocument();
    });

    const overdueTab = screen.getByRole('button', { name: /4. Overdue Work Orders/i });
    await user.click(overdueTab);

    await waitFor(() => {
      expect(screen.getByText('WO-2026-042')).toBeInTheDocument();
      expect(screen.getByText('Laser Interferometer')).toBeInTheDocument();
      expect(screen.getByText('13 days')).toBeInTheDocument();
    });
  });
});
