import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { EquipmentListPage } from '@/pages/inventory/EquipmentListPage';
import * as AuthContextModule from '@/context/AuthContext';
import { inventoryApi } from '@/lib/inventoryApi';
import { EquipmentSummary, Laboratory, EquipmentCategory, PageResponse } from '@/types/inventory';

describe('EquipmentListPage', () => {
  const sampleEquipment: EquipmentSummary = {
    id: 'eq-1',
    assetTag: 'EQ-MIC-001',
    name: 'Zeiss Axio Observer 7',
    categoryName: 'Microscopes',
    categoryId: 'cat-1',
    laboratoryName: 'Imaging Suite',
    laboratoryCode: 'LAB-MIC-01',
    laboratoryId: 'lab-1',
    manufacturer: 'Carl Zeiss AG',
    model: 'Axio Observer 7',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    updatedAt: '2026-10-28T12:00:00Z',
  };

  const samplePageResponse: PageResponse<EquipmentSummary> = {
    content: [sampleEquipment],
    pageNumber: 0,
    pageSize: 15,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  };

  const sampleLabs: Laboratory[] = [
    {
      id: 'lab-1',
      code: 'LAB-MIC-01',
      name: 'Imaging Suite',
      building: 'Discovery Hall',
      roomNumber: '402',
      active: true,
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    },
  ];

  const sampleCategories: EquipmentCategory[] = [
    {
      id: 'cat-1',
      code: 'MICR',
      name: 'Microscopes',
      createdAt: '2026-10-28T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryApi, 'getEquipment').mockResolvedValue(samplePageResponse);
    vi.spyOn(inventoryApi, 'getLaboratories').mockResolvedValue(sampleLabs);
    vi.spyOn(inventoryApi, 'getCategories').mockResolvedValue(sampleCategories);
  });

  it('renders equipment inventory table and items for authenticated student', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'student@university.edu',
        firstName: 'Elena',
        lastName: 'Rostova',
        status: 'ACTIVE',
        roles: ['ROLE_STUDENT'],
        createdAt: '2026-10-28T12:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <EquipmentListPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(
      screen.getByRole('heading', { name: /Equipment Inventory/i })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('EQ-MIC-001')).toBeInTheDocument();
      expect(screen.getByText('Zeiss Axio Observer 7')).toBeInTheDocument();
      expect(screen.getByText('Imaging Suite')).toBeInTheDocument();
      expect(screen.getAllByText('Available').length).toBeGreaterThanOrEqual(1);
    });

    // Student should not see "Register Instrument" button
    expect(screen.queryByRole('button', { name: /Register Instrument/i })).not.toBeInTheDocument();
  });

  it('shows Register Instrument button for administrator', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'admin-1',
        email: 'admin@university.edu',
        firstName: 'System',
        lastName: 'Administrator',
        status: 'ACTIVE',
        roles: ['ROLE_ADMIN'],
        createdAt: '2026-10-28T12:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <EquipmentListPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Register Instrument/i })).toBeInTheDocument();
    });
  });

  it('displays empty state when no matching instruments found', async () => {
    vi.spyOn(inventoryApi, 'getEquipment').mockResolvedValueOnce({
      content: [],
      pageNumber: 0,
      pageSize: 15,
      totalElements: 0,
      totalPages: 0,
      first: true,
      last: true,
    });

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'student-1',
        email: 'student@university.edu',
        firstName: 'Elena',
        lastName: 'Rostova',
        status: 'ACTIVE',
        roles: ['ROLE_STUDENT'],
        createdAt: '2026-10-28T12:00:00Z',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <ThemeProvider>
        <MemoryRouter>
          <EquipmentListPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText(/No matching laboratory instruments found/i)).toBeInTheDocument();
    });
  });
});
