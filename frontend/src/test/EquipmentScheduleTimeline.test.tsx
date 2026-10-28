import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentScheduleTimeline } from '@/components/reservation/EquipmentScheduleTimeline';
import { reservationApi } from '@/lib/reservationApi';
import { EquipmentSchedule } from '@/types/reservation';

describe('EquipmentScheduleTimeline', () => {
  const sampleSchedule: EquipmentSchedule = {
    equipmentId: 'eq-100',
    equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
    assetTag: 'EQ-PHYS-001',
    rangeStart: '2026-10-28T00:00:00Z',
    rangeEnd: '2026-11-11T00:00:00Z',
    activeSlots: [
      {
        reservationId: 'slot-1',
        startTime: '2026-10-29T10:00:00Z',
        endTime: '2026-10-29T12:00:00Z',
        status: 'APPROVED',
        bookedByName: 'Alice Johnson',
      },
      {
        reservationId: 'slot-2',
        startTime: '2026-10-30T14:00:00Z',
        endTime: '2026-10-30T16:00:00Z',
        status: 'PENDING',
        bookedByName: 'Bob Smith',
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(reservationApi, 'getEquipmentSchedule').mockResolvedValue(sampleSchedule);
  });

  it('renders active scheduled slots and user bookings', async () => {
    render(
      <EquipmentScheduleTimeline
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        isReservable={true}
      />
    );

    expect(screen.getByText('Schedule & Active Bookings')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText(/Showing 2 active reservations in the next 14 days/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no active reservations exist', async () => {
    vi.spyOn(reservationApi, 'getEquipmentSchedule').mockResolvedValue({
      equipmentId: 'eq-100',
      equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
      assetTag: 'EQ-PHYS-001',
      rangeStart: '2026-10-28T00:00:00Z',
      rangeEnd: '2026-11-11T00:00:00Z',
      activeSlots: [],
    });

    render(
      <EquipmentScheduleTimeline
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        isReservable={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('No Confirmed or Pending Reservations')).toBeInTheDocument();
      expect(screen.getByText(/The instrument is completely available/i)).toBeInTheDocument();
    });
  });

  it('updates days window when user clicks 7 or 30 days filter', async () => {
    const user = userEvent.setup();
    render(
      <EquipmentScheduleTimeline
        equipmentId="eq-100"
        equipmentName="Rigaku SmartLab X-Ray Diffractometer"
        isReservable={true}
      />
    );

    await waitFor(() => {
      expect(reservationApi.getEquipmentSchedule).toHaveBeenCalledTimes(1);
    });

    const sevenDaysBtn = screen.getByRole('button', { name: '7 Days' });
    await user.click(sevenDaysBtn);

    await waitFor(() => {
      expect(reservationApi.getEquipmentSchedule).toHaveBeenCalledTimes(2);
    });
  });
});
