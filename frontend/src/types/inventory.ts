export type EquipmentCondition =
  | 'NEW'
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'DAMAGED';

export type EquipmentStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'UNDER_MAINTENANCE'
  | 'RESERVED'
  | 'ARCHIVED';

export type EquipmentDocumentType =
  | 'USER_MANUAL'
  | 'SAFETY_GUIDE'
  | 'CALIBRATION_CERT'
  | 'MAINTENANCE_LOG'
  | 'OTHER';

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface Laboratory {
  id: string;
  code: string;
  name: string;
  building: string;
  roomNumber: string;
  description?: string;
  active: boolean;
  managerId?: string;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentCategory {
  id: string;
  code: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface EquipmentSummary {
  id: string;
  assetTag: string;
  name: string;
  categoryName: string;
  categoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  laboratoryId: string;
  manufacturer: string;
  model: string;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  updatedAt: string;
}

export interface EquipmentStatusHistory {
  id: string;
  previousStatus: EquipmentStatus;
  newStatus: EquipmentStatus;
  changedByName?: string;
  changedByEmail?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
}

export interface EquipmentDocument {
  id: string;
  title: string;
  documentType: EquipmentDocumentType;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
  uploadedByName?: string;
  createdAt: string;
}

export interface EquipmentDetail {
  id: string;
  assetTag: string;
  name: string;
  category: EquipmentCategory;
  laboratory: Laboratory;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  condition: EquipmentCondition;
  status: EquipmentStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiration?: string;
  description?: string;
  specificationsJson?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: EquipmentStatusHistory[];
  documents: EquipmentDocument[];
}

export interface CreateEquipmentPayload {
  assetTag: string;
  name: string;
  categoryId: string;
  laboratoryId: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  condition: EquipmentCondition;
  status?: EquipmentStatus;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiration?: string;
  description?: string;
  specificationsJson?: string;
}

export interface UpdateEquipmentPayload {
  name: string;
  categoryId: string;
  laboratoryId: string;
  manufacturer: string;
  model: string;
  serialNumber?: string;
  condition: EquipmentCondition;
  purchaseDate?: string;
  purchaseCost?: number;
  warrantyExpiration?: string;
  description?: string;
  specificationsJson?: string;
}

export interface UpdateEquipmentStatusPayload {
  status: EquipmentStatus;
  reason?: string;
  notes?: string;
}

export interface CreateLaboratoryPayload {
  code: string;
  name: string;
  building: string;
  roomNumber: string;
  description?: string;
  managerId?: string;
}

export interface UpdateLaboratoryPayload {
  name: string;
  building: string;
  roomNumber: string;
  description?: string;
  active?: boolean;
  managerId?: string;
}

export interface CreateCategoryPayload {
  code: string;
  name: string;
  description?: string;
}

export interface CreateDocumentPayload {
  title: string;
  documentType: EquipmentDocumentType;
  fileUrl: string;
  fileName: string;
  fileSizeBytes?: number;
  mimeType?: string;
}

export interface EquipmentFilterParams {
  query?: string;
  laboratoryId?: string;
  categoryId?: string;
  status?: EquipmentStatus;
  condition?: EquipmentCondition;
  page?: number;
  size?: number;
  sort?: string;
}
