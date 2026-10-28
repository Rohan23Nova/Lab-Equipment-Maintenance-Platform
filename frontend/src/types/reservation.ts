export type ReservationStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Reservation {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  laboratoryCode: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  startTime: string; // ISO-8601 UTC string
  endTime: string;   // ISO-8601 UTC string
  purpose: string;
  status: ReservationStatus;
  decisionByUserId?: string;
  decisionByUserName?: string;
  decisionAt?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReservationSummary {
  id: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  laboratoryCode: string;
  userId: string;
  userFullName: string;
  startTime: string;
  endTime: string;
  purpose: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface CreateReservationPayload {
  equipmentId: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  purpose: string;
}

export interface RejectReservationPayload {
  reason: string;
}

export interface CancelReservationPayload {
  reason?: string;
}

export interface TimeSlot {
  reservationId: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  bookedByName: string;
}

export interface EquipmentSchedule {
  equipmentId: string;
  equipmentName: string;
  assetTag: string;
  rangeStart: string;
  rangeEnd: string;
  activeSlots: TimeSlot[];
}

export interface AvailabilityCheckResult {
  available: boolean;
  reason: string;
  startTime: string;
  endTime: string;
}
