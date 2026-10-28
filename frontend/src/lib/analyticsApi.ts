import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import {
  DashboardMetricsResponse,
  EquipmentRepeatedFaultsDto,
  InventoryDistributionReport,
  MaintenanceTrendsReport,
  OverdueWorkOrderReport,
  ReportFilterCriteria,
  UtilizationReport,
} from '@/types/analytics';

export const analyticsApi = {
  getDashboardMetrics: async (filter?: ReportFilterCriteria): Promise<DashboardMetricsResponse> => {
    const query = new URLSearchParams();
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);
    if (filter?.laboratoryId) query.set('laboratoryId', filter.laboratoryId);
    if (filter?.categoryId) query.set('categoryId', filter.categoryId);

    const qs = query.toString();
    const endpoint = `/analytics/dashboard${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<DashboardMetricsResponse>>(endpoint);
    return response.data;
  },

  getInventoryReport: async (filter?: ReportFilterCriteria): Promise<InventoryDistributionReport> => {
    const query = new URLSearchParams();
    if (filter?.laboratoryId) query.set('laboratoryId', filter.laboratoryId);
    if (filter?.categoryId) query.set('categoryId', filter.categoryId);

    const qs = query.toString();
    const endpoint = `/analytics/reports/inventory${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<InventoryDistributionReport>>(endpoint);
    return response.data;
  },

  getUtilizationReport: async (filter?: ReportFilterCriteria): Promise<UtilizationReport> => {
    const query = new URLSearchParams();
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);
    if (filter?.laboratoryId) query.set('laboratoryId', filter.laboratoryId);
    if (filter?.categoryId) query.set('categoryId', filter.categoryId);

    const qs = query.toString();
    const endpoint = `/analytics/reports/utilization${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<UtilizationReport>>(endpoint);
    return response.data;
  },

  getMaintenanceReport: async (filter?: ReportFilterCriteria): Promise<MaintenanceTrendsReport> => {
    const query = new URLSearchParams();
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);

    const qs = query.toString();
    const endpoint = `/analytics/reports/maintenance${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<MaintenanceTrendsReport>>(endpoint);
    return response.data;
  },

  getOverdueMaintenanceReport: async (): Promise<OverdueWorkOrderReport[]> => {
    const response = await apiClient.get<ApiResponse<OverdueWorkOrderReport[]>>('/analytics/reports/overdue-maintenance');
    return response.data;
  },

  getRepeatedFailuresReport: async (filter?: ReportFilterCriteria): Promise<EquipmentRepeatedFaultsDto[]> => {
    const query = new URLSearchParams();
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);

    const qs = query.toString();
    const endpoint = `/analytics/reports/repeated-failures${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<EquipmentRepeatedFaultsDto[]>>(endpoint);
    return response.data;
  },

  getExportUrl: (reportType: string, filter?: ReportFilterCriteria): string => {
    const query = new URLSearchParams();
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);
    if (filter?.laboratoryId) query.set('laboratoryId', filter.laboratoryId);
    if (filter?.categoryId) query.set('categoryId', filter.categoryId);

    const qs = query.toString();
    return `/api/v1/analytics/reports/export/${reportType}${qs ? `?${qs}` : ''}`;
  },
};
