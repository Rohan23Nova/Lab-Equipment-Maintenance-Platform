import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { LaboratoryListPage } from '@/pages/inventory/LaboratoryListPage';
import * as AuthContextModule from '@/context/AuthContext';
import { inventoryApi } from '@/lib/inventoryApi';
import { Laboratory } from '@/types/inventory';

describe('LaboratoryListPage', () => {
  const sampleLabs: Laboratory[] = [
    {
      id: 'lab-1',
      code: 'LAB-MIC-01',
      name: 'Microscopy & Imaging Suite',
      building: 'Discovery Hall',
      roomNumber: 'Room 402',
      description: 'Advanced optical and electron microscopy suite',
      active: true,
      managerId: 'mgr-1',
      managerName: 'Dr. Sarah Jenkins',
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    },
    {
      id: 'lab-2',
      code: 'LAB-SPECT-01',
      name: 'Spectroscopy Analysis Lab',
      building: 'Physical Sciences Annex',
      roomNumber: 'Room 110',
      description: 'Molecular spectroscopy facilities',
      active: false,
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryApi, 'getLaboratories').mockResolvedValue(sampleLabs);
  });

  it('renders laboratory facilities and active badges', async () => {
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
          <LaboratoryListPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    expect(screen.getByText(/Laboratory Facilities & Research Bays/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('LAB-MIC-01')).toBeInTheDocument();
      expect(screen.getByText('Microscopy & Imaging Suite')).toBeInTheDocument();
      expect(screen.getByText('LAB-SPECT-01')).toBeInTheDocument();
      expect(screen.getByText('Spectroscopy Analysis Lab')).toBeInTheDocument();
      expect(screen.getByText(/Dr\. Sarah Jenkins/i)).toBeInTheDocument();
    });

    // Student should not see Register Facility button
    expect(screen.queryByRole('button', { name: /Register Facility/i })).not.toBeInTheDocument();
  });

  it('shows Register Facility button for administrator or lab assistant', async () => {
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
          <LaboratoryListPage />
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Register Facility/i })).toBeInTheDocument();
    });
  });
});
