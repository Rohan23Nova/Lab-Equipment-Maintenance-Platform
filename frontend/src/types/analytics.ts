export interface CriticalActionItem {
  id: string;
  actionType: 'PENDING_APPROVAL' | 'CRITICAL_FAULT' | 'OVERDUE_WORK_ORDER' | 'EXPIRING_WARRANTY' | string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  targetUrl: string;
  createdAt: string;
}

export interface IncidentTrendPoint {
  date: string;
  reportedFaults: number;
  criticalFaults: number;
  completedRepairs: number;
}

export interface EquipmentRepeatedFaultsDto {
  equipmentId: string;
  assetTag: string;
  equipmentName: string;
  laboratoryName: string;
  status: string;
  faultCount: number;
  criticalCount: number;
  lastFaultDate: string;
}

export interface DashboardMetricsResponse {
  role: 'STAFF' | 'TECHNICIAN' | 'STUDENT';
  totalActiveEquipment: number;
  unavailableEquipment: number;
  pendingReservations: number;
  upcomingReservations: number;
  openFaults: number;
  criticalFaults: number;
  activeWorkOrders: number;
  overdueWorkOrders: number;
  overallUtilizationPercentage: number | null;
  totalCapacityHours: number;
  totalBookedHours: number;
  meanTimeToRepairHours: number | null;
  criticalActions: CriticalActionItem[];
  incidentTrends: IncidentTrendPoint[];
  topRepeatedFailures: EquipmentRepeatedFaultsDto[];
}

export interface InventoryDistributionReport {
  totalActive: number;
  totalArchived: number;
  totalPurchaseCost: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byCondition: Record<string, number>;
  byLaboratory: Record<string, number>;
}

export interface EquipmentUtilizationDetail {
  equipmentId: string;
  assetTag: string;
  equipmentName: string;
  laboratoryName: string;
  capacityHours: number;
  bookedHours: number;
  utilizationPercentage: number;
  completedReservationsCount: number;
}

export interface UtilizationReport {
  fromTimestamp: string;
  toTimestamp: string;
  totalCapacityHours: number;
  totalBookedHours: number;
  overallUtilizationPercentage: number;
  details: EquipmentUtilizationDetail[];
}

export interface MaintenanceTrendsReport {
  fromTimestamp: string;
  toTimestamp: string;
  totalFaults: number;
  criticalFaults: number;
  openFaults: number;
  resolvedFaults: number;
  completedWorkOrders: number;
  totalPartsCost: number;
  totalLaborHours: number;
  meanTimeToRepairHours: number | null;
  dailyTrends: IncidentTrendPoint[];
}

export interface OverdueWorkOrderReport {
  workOrderId: string;
  workOrderNumber: string;
  title: string;
  equipmentAssetTag: string;
  equipmentName: string;
  laboratoryName: string;
  assignedTechnicianName: string;
  priority: string;
  status: string;
  plannedCompletionDate: string;
  daysOverdue: number;
}

export interface ReportFilterCriteria {
  fromTimestamp?: string;
  toTimestamp?: string;
  laboratoryId?: string;
  categoryId?: string;
  status?: string;
}
