import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@/context/ThemeContext';
import { EquipmentDetailPage } from '@/pages/inventory/EquipmentDetailPage';
import * as AuthContextModule from '@/context/AuthContext';
import { inventoryApi } from '@/lib/inventoryApi';
import { EquipmentDetail } from '@/types/inventory';

describe('EquipmentDetailPage', () => {
  const sampleEquipmentDetail: EquipmentDetail = {
    id: 'eq-100',
    assetTag: 'EQ-CONFOCAL-01',
    name: 'Leica SP8 Laser Confocal',
    category: {
      id: 'cat-1',
      code: 'MICR',
      name: 'Microscopes',
      createdAt: '2026-10-28T12:00:00Z',
    },
    laboratory: {
      id: 'lab-1',
      code: 'LAB-BIO-01',
      name: 'Cell Biology Center',
      building: 'Discovery Hall',
      roomNumber: 'Room 501',
      active: true,
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    },
    manufacturer: 'Leica Microsystems',
    model: 'TCS SP8',
    serialNumber: 'SN-LEICA-994',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    purchaseDate: '2023-05-10',
    purchaseCost: 145000,
    warrantyExpiration: '2027-05-10',
    description: 'High-resolution confocal laser scanning microscope with resonant scanner.',
    specificationsJson: '{"lasers": ["405nm", "488nm", "561nm", "633nm"]}',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T12:00:00Z',
    statusHistory: [
      {
        id: 'hist-1',
        previousStatus: 'UNDER_MAINTENANCE',
        newStatus: 'AVAILABLE',
        changedByName: 'Dr. Sarah Jenkins',
        changedByEmail: 'sarah.jenkins@university.edu',
        reason: 'Optical calibration passed successfully',
        notes: 'Aligned lasers and replaced green dichroic filter.',
        createdAt: '2026-10-28T12:00:00Z',
      },
    ],
    documents: [
      {
        id: 'doc-1',
        title: 'Leica SP8 Quick Start Guide',
        documentType: 'USER_MANUAL',
        fileUrl: 'https://docs.university.edu/sp8-guide.pdf',
        fileName: 'sp8-guide.pdf',
        createdAt: '2026-10-28T12:00:00Z',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(inventoryApi, 'getEquipmentById').mockResolvedValue(sampleEquipmentDetail);
  });

  it('renders instrument profile specifications and laboratory location', async () => {
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
        <MemoryRouter initialEntries={['/app/equipment/eq-100']}>
          <Routes>
            <Route path="/app/equipment/:id" element={<EquipmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('EQ-CONFOCAL-01')).toBeInTheDocument();
      expect(screen.getByText('Leica SP8 Laser Confocal')).toBeInTheDocument();
      expect(screen.getByText('Cell Biology Center')).toBeInTheDocument();
      expect(screen.getByText('Discovery Hall')).toBeInTheDocument();
      expect(screen.getByText('$145,000')).toBeInTheDocument();
    });

    // Student cannot transition status or decommission
    expect(screen.queryByRole('button', { name: /Transition Status/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Decommission/i })).not.toBeInTheDocument();
  });

  it('allows administrator to transition status and edit specifications', async () => {
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
        <MemoryRouter initialEntries={['/app/equipment/eq-100']}>
          <Routes>
            <Route path="/app/equipment/:id" element={<EquipmentDetailPage />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Transition Status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Edit Details/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Decommission/i })).toBeInTheDocument();
    });
  });
});
