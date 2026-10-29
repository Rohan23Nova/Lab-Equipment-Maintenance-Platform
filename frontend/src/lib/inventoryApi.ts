import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import {
  EquipmentCategory,
  EquipmentDetail,
  EquipmentDocument,
  EquipmentFilterParams,
  EquipmentStatusHistory,
  EquipmentSummary,
  Laboratory,
  PageResponse,
  CreateEquipmentPayload,
  UpdateEquipmentPayload,
  UpdateEquipmentStatusPayload,
  CreateLaboratoryPayload,
  UpdateLaboratoryPayload,
  CreateCategoryPayload,
  CreateDocumentPayload,
  TeachingExperimentSummary,
  TeachingExperimentDetail,
} from '@/types/inventory';

export const inventoryApi = {
  // Equipment endpoints
  getEquipment: async (params?: EquipmentFilterParams): Promise<PageResponse<EquipmentSummary>> => {
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set('query', params.query);
    if (params?.laboratoryId) searchParams.set('laboratoryId', params.laboratoryId);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.condition) searchParams.set('condition', params.condition);
    if (params?.page !== undefined) searchParams.set('page', params.page.toString());
    if (params?.size !== undefined) searchParams.set('size', params.size.toString());
    if (params?.sort) searchParams.set('sort', params.sort);

    const queryStr = searchParams.toString();
    const endpoint = `/equipment${queryStr ? `?${queryStr}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<EquipmentSummary>>>(endpoint);
    return response.data;
  },

  getEquipmentById: async (id: string): Promise<EquipmentDetail> => {
    const response = await apiClient.get<ApiResponse<EquipmentDetail>>(`/equipment/${id}`);
    return response.data;
  },

  createEquipment: async (payload: CreateEquipmentPayload): Promise<EquipmentDetail> => {
    const response = await apiClient.post<ApiResponse<EquipmentDetail>>('/equipment', payload);
    return response.data;
  },

  updateEquipment: async (id: string, payload: UpdateEquipmentPayload): Promise<EquipmentDetail> => {
    const response = await apiClient.put<ApiResponse<EquipmentDetail>>(`/equipment/${id}`, payload);
    return response.data;
  },

  updateEquipmentStatus: async (
    id: string,
    payload: UpdateEquipmentStatusPayload
  ): Promise<EquipmentDetail> => {
    const response = await apiClient.patch<ApiResponse<EquipmentDetail>>(
      `/equipment/${id}/status`,
      payload
    );
    return response.data;
  },

  archiveEquipment: async (id: string, reason?: string): Promise<EquipmentDetail> => {
    const query = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    const response = await apiClient.patch<ApiResponse<EquipmentDetail>>(
      `/equipment/${id}/archive${query}`
    );
    return response.data;
  },

  getEquipmentHistory: async (id: string): Promise<EquipmentStatusHistory[]> => {
    const response = await apiClient.get<ApiResponse<EquipmentStatusHistory[]>>(
      `/equipment/${id}/history`
    );
    return response.data;
  },

  addDocument: async (
    id: string,
    payload: CreateDocumentPayload
  ): Promise<EquipmentDocument> => {
    const response = await apiClient.post<ApiResponse<EquipmentDocument>>(
      `/equipment/${id}/documents`,
      payload
    );
    return response.data;
  },

  // Laboratory endpoints
  getLaboratories: async (activeOnly = false): Promise<Laboratory[]> => {
    const endpoint = `/laboratories${activeOnly ? '?activeOnly=true' : ''}`;
    const response = await apiClient.get<ApiResponse<Laboratory[]>>(endpoint);
    return response.data;
  },

  getLaboratoryById: async (id: string): Promise<Laboratory> => {
    const response = await apiClient.get<ApiResponse<Laboratory>>(`/laboratories/${id}`);
    return response.data;
  },

  createLaboratory: async (payload: CreateLaboratoryPayload): Promise<Laboratory> => {
    const response = await apiClient.post<ApiResponse<Laboratory>>('/laboratories', payload);
    return response.data;
  },

  updateLaboratory: async (id: string, payload: UpdateLaboratoryPayload): Promise<Laboratory> => {
    const response = await apiClient.put<ApiResponse<Laboratory>>(`/laboratories/${id}`, payload);
    return response.data;
  },

  // Equipment Category endpoints
  getCategories: async (): Promise<EquipmentCategory[]> => {
    const response = await apiClient.get<ApiResponse<EquipmentCategory[]>>('/equipment-categories');
    return response.data;
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<EquipmentCategory> => {
    const response = await apiClient.post<ApiResponse<EquipmentCategory>>(
      '/equipment-categories',
      payload
    );
    return response.data;
  },

  // Teaching Experiment endpoints
  getExperiments: async (params?: { subject?: string; laboratoryId?: string }): Promise<TeachingExperimentSummary[]> => {
    const searchParams = new URLSearchParams();
    if (params?.subject) searchParams.set('subject', params.subject);
    if (params?.laboratoryId) searchParams.set('laboratoryId', params.laboratoryId);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const response = await apiClient.get<ApiResponse<TeachingExperimentSummary[]>>(`/experiments${queryString}`);
    return response.data;
  },

  getExperimentById: async (id: string): Promise<TeachingExperimentDetail> => {
    const response = await apiClient.get<ApiResponse<TeachingExperimentDetail>>(`/experiments/${id}`);
    return response.data;
  },

  getExperimentsByEquipment: async (equipmentId: string): Promise<TeachingExperimentSummary[]> => {
    const response = await apiClient.get<ApiResponse<TeachingExperimentSummary[]>>(`/experiments/by-equipment/${equipmentId}`);
    return response.data;
  },

  getExperimentsByLaboratory: async (laboratoryId: string): Promise<TeachingExperimentSummary[]> => {
    const response = await apiClient.get<ApiResponse<TeachingExperimentSummary[]>>(`/experiments/by-laboratory/${laboratoryId}`);
    return response.data;
  },
};
