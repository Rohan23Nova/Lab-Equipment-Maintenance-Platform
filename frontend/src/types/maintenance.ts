export type FaultSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type FaultStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'IN_REPAIR'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type WorkOrderPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type WorkOrderStatus =
  | 'CREATED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type NoteType =
  | 'PROGRESS_UPDATE'
  | 'DIAGNOSTIC_FINDING'
  | 'PARTS_ORDERED'
  | 'BLOCKER_FLAG'
  | 'INSPECTION_NOTE';

export interface FaultReport {
  id: string;
  faultNumber: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  reportedById: string;
  reportedByName: string;
  reportedByEmail: string;
  title: string;
  description: string;
  severity: FaultSeverity;
  status: FaultStatus;
  reportedAt: string;
  triagedById?: string;
  triagedByName?: string;
  triagedAt?: string;
  triageNotes?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  resolutionDetails?: string;
  closedById?: string;
  closedByName?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FaultReportSummary {
  id: string;
  faultNumber: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  reportedById: string;
  reportedByName: string;
  title: string;
  severity: FaultSeverity;
  status: FaultStatus;
  reportedAt: string;
  createdAt: string;
}

export interface CreateFaultReportPayload {
  equipmentId: string;
  title: string;
  description: string;
  severity: FaultSeverity;
}

export interface TriageFaultReportPayload {
  status: FaultStatus;
  triageNotes?: string;
  placeUnderMaintenance?: boolean;
}

export interface ResolveFaultReportPayload {
  resolutionDetails: string;
}

export interface WorkOrderNote {
  id: string;
  workOrderId: string;
  authorId: string;
  authorName: string;
  noteType: NoteType;
  notes: string;
  createdAt: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  workOrderNumber: string;
  faultReportId?: string;
  faultReportNumber?: string;
  faultReportTitle?: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  assignedTechnicianEmail?: string;
  createdById: string;
  createdByName: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  blockedReason?: string;
  plannedStartDate?: string;
  plannedCompletionDate?: string;
  actualStartTime?: string;
  actualCompletionTime?: string;
  laborHours: number;
  partsCost: number;
  resolutionSummary?: string;
  passedInspection: boolean;
  inspectedById?: string;
  inspectedByName?: string;
  inspectedAt?: string;
  inspectionNotes?: string;
  notes: WorkOrderNote[];
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceWorkOrderSummary {
  id: string;
  workOrderNumber: string;
  faultReportId?: string;
  faultReportNumber?: string;
  equipmentId: string;
  equipmentName: string;
  equipmentAssetTag: string;
  laboratoryName: string;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  title: string;
  priority: WorkOrderPriority;
  status: WorkOrderStatus;
  plannedCompletionDate?: string;
  passedInspection: boolean;
  createdAt: string;
}

export interface CreateWorkOrderPayload {
  faultReportId?: string;
  equipmentId: string;
  assignedTechnicianId?: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  plannedStartDate?: string;
  plannedCompletionDate?: string;
}

export interface AssignWorkOrderPayload {
  technicianId: string;
}

export interface UpdateWorkOrderProgressPayload {
  status: WorkOrderStatus;
  blockedReason?: string;
  laborHours?: number;
  partsCost?: number;
  resolutionSummary?: string;
  progressNote?: string;
}

export interface AddWorkOrderNotePayload {
  noteType: NoteType;
  notes: string;
}

export interface CompleteWorkOrderPayload {
  resolutionSummary: string;
  laborHours?: number;
  partsCost?: number;
}

export interface ReturnToServicePayload {
  passedInspection: boolean;
  inspectionNotes: string;
  returnEquipmentToAvailable?: boolean;
}
