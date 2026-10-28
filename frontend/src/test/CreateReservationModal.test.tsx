import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateReservationModal } from '@/components/reservation/CreateReservationModal';
import { reservationApi } from '@/lib/reservationApi';
import { EquipmentDetail } from '@/types/inventory';
import { Reservation } from '@/types/reservation';

describe('CreateReservationModal', () => {
  const sampleEquipment: EquipmentDetail = {
    id: 'eq-100',
    assetTag: 'EQ-PHYS-001',
    name: 'Rigaku SmartLab X-Ray Diffractometer',
    category: {
      id: 'cat-1',
      code: 'DIFF',
      name: 'Diffractometers',
      createdAt: '2026-10-28T12:00:00Z',
    },
    laboratory: {
      id: 'lab-1',
      code: 'LAB-PHYS-01',
      name: 'Advanced Materials Characterization Facility',
      building: 'Physics Complex',
      roomNumber: 'Room 102',
      active: true,
      createdAt: '2026-10-28T12:00:00Z',
      updatedAt: '2026-10-28T12:00:00Z',
    },
    manufacturer: 'Rigaku',
    model: 'SmartLab',
    condition: 'EXCELLENT',
    status: 'AVAILABLE',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T12:00:00Z',
    statusHistory: [],
    documents: [],
  };

  const sampleCreatedReservation: Reservation = {
    id: 'res-new-1',
    equipmentId: 'eq-100',
    equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
    equipmentAssetTag: 'EQ-PHYS-001',
    laboratoryName: 'Advanced Materials Characterization Facility',
    laboratoryCode: 'LAB-PHYS-01',
    userId: 'user-1',
    userFullName: 'Alice Johnson',
    userEmail: 'alice.johnson@university.edu',
    startTime: '2026-10-29T10:00:00Z',
    endTime: '2026-10-29T12:00:00Z',
    purpose: 'Crystallography analysis on thin-film polymer samples',
    status: 'PENDING',
    createdAt: '2026-10-28T12:00:00Z',
    updatedAt: '2026-10-28T12:00:00Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reservationApi, 'checkAvailability').mockResolvedValue({
      available: true,
      reason: 'Requested interval is free',
      startTime: '2026-10-29T10:00:00Z',
      endTime: '2026-10-29T12:00:00Z',
    });
    vi.spyOn(reservationApi, 'createReservation').mockResolvedValue(sampleCreatedReservation);
  });

  it('renders modal with equipment details and header', () => {
    render(
      <CreateReservationModal
        equipment={sampleEquipment}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    expect(screen.getByText('Schedule Instrument Reservation')).toBeInTheDocument();
    expect(screen.getByText(/Rigaku SmartLab X-Ray Diffractometer/i)).toBeInTheDocument();
    expect(screen.getByText('EQ-PHYS-001')).toBeInTheDocument();
    expect(screen.getByText(/Advanced Materials Characterization Facility/)).toBeInTheDocument();
  });

  it('performs pre-flight availability check on mount', async () => {
    render(
      <CreateReservationModal
        equipment={sampleEquipment}
        isOpen={true}
        onClose={vi.fn()}
        onSuccess={vi.fn()}
      />
    );

    await waitFor(() => {
      expect(reservationApi.checkAvailability).toHaveBeenCalled();
    });
  });

  it('submits valid reservation and triggers onSuccess callback', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(
      <CreateReservationModal
        equipment={sampleEquipment}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const purposeInput = screen.getByPlaceholderText(/Fluorescence imaging of live mammalian/i);
    await user.clear(purposeInput);
    await user.type(purposeInput, 'Crystallography analysis on thin-film polymer samples');

    const submitBtn = screen.getByRole('button', { name: /Submit Booking Request/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(reservationApi.createReservation).toHaveBeenCalled();
      expect(handleSuccess).toHaveBeenCalledWith(sampleCreatedReservation);
    });
  });
});
