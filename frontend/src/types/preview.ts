export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'CALIBRATION_PENDING';

export interface PreviewEquipmentItem {
  id: string;
  assetTag: string;
  name: string;
  model: string;
  category: string;
  labLocation: string;
  status: EquipmentStatus;
  requiredCertification?: string;
  nextSlotTime?: string;
  healthScore: number;
}

export interface PreviewReservation {
  id: string;
  equipmentName: string;
  assetTag: string;
  bookedBy: string;
  department: string;
  interval: string; // e.g. "[10:00, 12:30)"
  status: 'CONFIRMED' | 'CHECKED_IN';
  purpose: string;
}

export interface PreviewWorkOrder {
  id: string;
  workOrderNumber: string;
  equipmentName: string;
  assetTag: string;
  faultSummary: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'IN_PROGRESS' | 'OPEN' | 'WAITING_FOR_PARTS';
  assignedTechnician: string;
  loggedHours: string;
}
