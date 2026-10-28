import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/inventory';
import { AuditEntityType, AuditLogItem, AuditLogSearchFilter } from '@/types/audit';

export const auditApi = {
  searchAuditLogs: async (filter?: AuditLogSearchFilter): Promise<PageResponse<AuditLogItem>> => {
    const query = new URLSearchParams();
    if (filter?.entityType) query.set('entityType', filter.entityType);
    if (filter?.action) query.set('action', filter.action);
    if (filter?.actorId) query.set('actorId', filter.actorId);
    if (filter?.search) query.set('search', filter.search);
    if (filter?.fromTimestamp) query.set('fromTimestamp', filter.fromTimestamp);
    if (filter?.toTimestamp) query.set('toTimestamp', filter.toTimestamp);
    if (filter?.page !== undefined) query.set('page', filter.page.toString());
    if (filter?.size !== undefined) query.set('size', filter.size.toString());

    const qs = query.toString();
    const endpoint = `/audit-logs${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<AuditLogItem>>>(endpoint);
    return response.data;
  },

  getAuditLogById: async (id: string): Promise<AuditLogItem> => {
    const response = await apiClient.get<ApiResponse<AuditLogItem>>(`/audit-logs/${id}`);
    return response.data;
  },

  getEntityAuditHistory: async (
    entityType: AuditEntityType,
    entityId: string,
    page = 0,
    size = 20
  ): Promise<PageResponse<AuditLogItem>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<AuditLogItem>>>(
      `/audit-logs/entity/${entityType}/${entityId}?page=${page}&size=${size}`
    );
    return response.data;
  },
};
