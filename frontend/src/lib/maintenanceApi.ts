import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/inventory';
import {
  AddWorkOrderNotePayload,
  AssignWorkOrderPayload,
  CompleteWorkOrderPayload,
  CreateFaultReportPayload,
  CreateWorkOrderPayload,
  FaultReport,
  FaultReportSummary,
  FaultSeverity,
  FaultStatus,
  MaintenanceWorkOrder,
  MaintenanceWorkOrderSummary,
  ResolveFaultReportPayload,
  ReturnToServicePayload,
  TriageFaultReportPayload,
  UpdateWorkOrderProgressPayload,
  WorkOrderNote,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@/types/maintenance';

export const maintenanceApi = {
  // Fault Reports
  reportFault: async (payload: CreateFaultReportPayload): Promise<FaultReport> => {
    const response = await apiClient.post<ApiResponse<FaultReport>>('/faults', payload);
    return response.data;
  },

  findFaults: async (params?: {
    equipmentId?: string;
    reportedById?: string;
    status?: FaultStatus;
    severity?: FaultSeverity;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<FaultReportSummary>> => {
    const query = new URLSearchParams();
    if (params?.equipmentId) query.set('equipmentId', params.equipmentId);
    if (params?.reportedById) query.set('reportedById', params.reportedById);
    if (params?.status) query.set('status', params.status);
    if (params?.severity) query.set('severity', params.severity);
    if (params?.search) query.set('search', params.search);
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());

    const qs = query.toString();
    const endpoint = `/faults${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<FaultReportSummary>>>(endpoint);
    return response.data;
  },

  getFaultById: async (id: string): Promise<FaultReport> => {
    const response = await apiClient.get<ApiResponse<FaultReport>>(`/faults/${id}`);
    return response.data;
  },

  triageFault: async (id: string, payload: TriageFaultReportPayload): Promise<FaultReport> => {
    const response = await apiClient.patch<ApiResponse<FaultReport>>(`/faults/${id}/triage`, payload);
    return response.data;
  },

  resolveFault: async (id: string, payload: ResolveFaultReportPayload): Promise<FaultReport> => {
    const response = await apiClient.patch<ApiResponse<FaultReport>>(`/faults/${id}/resolve`, payload);
    return response.data;
  },

  closeFault: async (id: string): Promise<FaultReport> => {
    const response = await apiClient.patch<ApiResponse<FaultReport>>(`/faults/${id}/close`, {});
    return response.data;
  },

  // Work Orders
  createWorkOrder: async (payload: CreateWorkOrderPayload): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.post<ApiResponse<MaintenanceWorkOrder>>('/work-orders', payload);
    return response.data;
  },

  findWorkOrders: async (params?: {
    equipmentId?: string;
    assignedTechnicianId?: string;
    status?: WorkOrderStatus;
    priority?: WorkOrderPriority;
    passedInspection?: boolean;
    search?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<MaintenanceWorkOrderSummary>> => {
    const query = new URLSearchParams();
    if (params?.equipmentId) query.set('equipmentId', params.equipmentId);
    if (params?.assignedTechnicianId) query.set('assignedTechnicianId', params.assignedTechnicianId);
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.passedInspection !== undefined) query.set('passedInspection', String(params.passedInspection));
    if (params?.search) query.set('search', params.search);
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());

    const qs = query.toString();
    const endpoint = `/work-orders${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<MaintenanceWorkOrderSummary>>>(endpoint);
    return response.data;
  },

  getTechnicianTasks: async (page = 0, size = 15): Promise<PageResponse<MaintenanceWorkOrderSummary>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<MaintenanceWorkOrderSummary>>>(
      `/work-orders/my-tasks?page=${page}&size=${size}`
    );
    return response.data;
  },

  getWorkOrderById: async (id: string): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.get<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}`);
    return response.data;
  },

  assignTechnician: async (id: string, payload: AssignWorkOrderPayload): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.patch<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}/assign`, payload);
    return response.data;
  },

  startWorkOrder: async (id: string): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.patch<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}/start`, {});
    return response.data;
  },

  updateWorkOrderProgress: async (
    id: string,
    payload: UpdateWorkOrderProgressPayload
  ): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.patch<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}/progress`, payload);
    return response.data;
  },

  addWorkOrderNote: async (id: string, payload: AddWorkOrderNotePayload): Promise<WorkOrderNote> => {
    const response = await apiClient.post<ApiResponse<WorkOrderNote>>(`/work-orders/${id}/notes`, payload);
    return response.data;
  },

  completeWorkOrder: async (id: string, payload: CompleteWorkOrderPayload): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.patch<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}/complete`, payload);
    return response.data;
  },

  returnToService: async (id: string, payload: ReturnToServicePayload): Promise<MaintenanceWorkOrder> => {
    const response = await apiClient.post<ApiResponse<MaintenanceWorkOrder>>(`/work-orders/${id}/return-to-service`, payload);
    return response.data;
  },

  getEquipmentMaintenanceHistory: async (equipmentId: string): Promise<MaintenanceWorkOrderSummary[]> => {
    const response = await apiClient.get<ApiResponse<MaintenanceWorkOrderSummary[]>>(
      `/work-orders/equipment/${equipmentId}/history`
    );
    return response.data;
  },
};
