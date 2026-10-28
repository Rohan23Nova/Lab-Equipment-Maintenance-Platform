export type AuditAction =
  | 'EQUIPMENT_CREATED'
  | 'EQUIPMENT_UPDATED'
  | 'EQUIPMENT_STATUS_CHANGED'
  | 'EQUIPMENT_ARCHIVED'
  | 'DOCUMENT_ATTACHED'
  | 'RESERVATION_CREATED'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'FAULT_REPORTED'
  | 'FAULT_TRIAGED'
  | 'FAULT_RESOLVED'
  | 'FAULT_CLOSED'
  | 'WORK_ORDER_CREATED'
  | 'WORK_ORDER_ASSIGNED'
  | 'WORK_ORDER_PROGRESS_UPDATED'
  | 'WORK_ORDER_COMPLETED'
  | 'EQUIPMENT_RETURNED_TO_SERVICE'
  | 'USER_CREATED'
  | 'USER_STATUS_UPDATED'
  | 'SYSTEM_CONFIGURED';

export type AuditEntityType =
  | 'EQUIPMENT'
  | 'RESERVATION'
  | 'FAULT_REPORT'
  | 'WORK_ORDER'
  | 'USER'
  | 'SYSTEM';

export interface AuditLogItem {
  id: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  entityIdentifier?: string;
  summary: string;
  detailsJson?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AuditLogSearchFilter {
  entityType?: AuditEntityType;
  action?: AuditAction;
  actorId?: string;
  search?: string;
  fromTimestamp?: string;
  toTimestamp?: string;
  page?: number;
  size?: number;
}
