import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuditLogsPage } from '@/pages/audit/AuditLogsPage';
import * as AuthContextModule from '@/context/AuthContext';
import { auditApi } from '@/lib/auditApi';
import { AuditLogItem } from '@/types/audit';
import { PageResponse } from '@/types/inventory';

describe('AuditLogsPage', () => {
  const sampleLogs: AuditLogItem[] = [
    {
      id: 'audit-1',
      actorId: 'admin-1',
      actorName: 'Admin User',
      actorEmail: 'admin@university.edu',
      action: 'EQUIPMENT_CREATED',
      entityType: 'EQUIPMENT',
      entityId: 'eq-1',
      entityIdentifier: 'EQ-PHYS-001',
      summary: 'Created new equipment Rigaku XRD',
      detailsJson: '{"name":"Rigaku XRD","model":"SmartLab"}',
      ipAddress: '127.0.0.1',
      createdAt: '2026-10-28T10:00:00Z',
    },
    {
      id: 'audit-2',
      actorId: 'staff-1',
      actorName: 'Sarah Assistant',
      actorEmail: 'staff@university.edu',
      action: 'RESERVATION_APPROVED',
      entityType: 'RESERVATION',
      entityId: 'res-10',
      entityIdentifier: 'RES-2026-10-01',
      summary: 'Approved reservation for Alice Johnson',
      detailsJson: '{"status":"APPROVED","approvedBy":"Sarah Assistant"}',
      ipAddress: '192.168.1.100',
      createdAt: '2026-10-28T11:00:00Z',
    },
  ];

  const samplePageResponse: PageResponse<AuditLogItem> = {
    content: sampleLogs,
    pageNumber: 0,
    pageSize: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@university.edu',
        firstName: 'System',
        lastName: 'Admin',
        roles: ['ROLE_ADMIN'],
        department: 'Operations',
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    vi.spyOn(auditApi, 'searchAuditLogs').mockResolvedValue(samplePageResponse);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ThemeProvider>
          <AuditLogsPage />
        </ThemeProvider>
      </MemoryRouter>
    );

  it('renders audit trail table and events', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Institutional Audit Trail')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Sarah Assistant')).toBeInTheDocument();
      expect(screen.getByText('EQ-PHYS-001')).toBeInTheDocument();
      expect(screen.getByText('Created new equipment Rigaku XRD')).toBeInTheDocument();
    });
  });

  it('filters by domain entity type', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const select = screen.getByRole('combobox');
    await user.selectOptions(select, 'EQUIPMENT');

    expect(auditApi.searchAuditLogs).toHaveBeenCalledWith(
      expect.objectContaining({ entityType: 'EQUIPMENT' })
    );
  });

  it('opens audit detail modal when inspect is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /inspect/i })).toHaveLength(2);
    });

    const inspectButtons = screen.getAllByRole('button', { name: /inspect/i });
    await user.click(inspectButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Audit Trail Entry')).toBeInTheDocument();
      expect(screen.getByText(/ID: audit-1/)).toBeInTheDocument();
      expect(screen.getByText(/Sanitized Audit Payload/)).toBeInTheDocument();
    });
  });
});
