import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/inventory';
import {
  AvailabilityCheckResult,
  CreateReservationPayload,
  EquipmentSchedule,
  RejectReservationPayload,
  CancelReservationPayload,
  Reservation,
  ReservationStatus,
  ReservationSummary,
} from '@/types/reservation';

export const reservationApi = {
  createReservation: async (payload: CreateReservationPayload): Promise<Reservation> => {
    const response = await apiClient.post<ApiResponse<Reservation>>('/reservations', payload);
    return response.data;
  },

  getMyReservations: async (
    status?: ReservationStatus,
    page = 0,
    size = 15
  ): Promise<PageResponse<ReservationSummary>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
    });
    if (status) params.set('status', status);

    const response = await apiClient.get<ApiResponse<PageResponse<ReservationSummary>>>(
      `/reservations/my?${params.toString()}`
    );
    return response.data;
  },

  getApprovalsQueue: async (page = 0, size = 20): Promise<PageResponse<ReservationSummary>> => {
    const response = await apiClient.get<ApiResponse<PageResponse<ReservationSummary>>>(
      `/reservations/approvals?page=${page}&size=${size}`
    );
    return response.data;
  },

  browseReservations: async (params?: {
    equipmentId?: string;
    userId?: string;
    status?: ReservationStatus;
    fromTime?: string;
    toTime?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<ReservationSummary>> => {
    const query = new URLSearchParams();
    if (params?.equipmentId) query.set('equipmentId', params.equipmentId);
    if (params?.userId) query.set('userId', params.userId);
    if (params?.status) query.set('status', params.status);
    if (params?.fromTime) query.set('fromTime', params.fromTime);
    if (params?.toTime) query.set('toTime', params.toTime);
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());

    const qs = query.toString();
    const endpoint = `/reservations${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<ReservationSummary>>>(endpoint);
    return response.data;
  },

  getReservationById: async (id: string): Promise<Reservation> => {
    const response = await apiClient.get<ApiResponse<Reservation>>(`/reservations/${id}`);
    return response.data;
  },

  getEquipmentSchedule: async (
    equipmentId: string,
    from?: string,
    to?: string
  ): Promise<EquipmentSchedule> => {
    const query = new URLSearchParams();
    if (from) query.set('from', from);
    if (to) query.set('to', to);

    const qs = query.toString();
    const endpoint = `/reservations/equipment/${equipmentId}/schedule${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<EquipmentSchedule>>(endpoint);
    return response.data;
  },

  checkAvailability: async (
    equipmentId: string,
    startTime: string,
    endTime: string
  ): Promise<AvailabilityCheckResult> => {
    const query = new URLSearchParams({
      equipmentId,
      startTime,
      endTime,
    });
    const response = await apiClient.get<ApiResponse<AvailabilityCheckResult>>(
      `/reservations/availability?${query.toString()}`
    );
    return response.data;
  },

  approveReservation: async (id: string): Promise<Reservation> => {
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/reservations/${id}/approve`
    );
    return response.data;
  },

  rejectReservation: async (id: string, reason: string): Promise<Reservation> => {
    const payload: RejectReservationPayload = { reason };
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/reservations/${id}/reject`,
      payload
    );
    return response.data;
  },

  cancelReservation: async (id: string, reason?: string): Promise<Reservation> => {
    const payload: CancelReservationPayload = reason ? { reason } : {};
    const response = await apiClient.patch<ApiResponse<Reservation>>(
      `/reservations/${id}/cancel`,
      payload
    );
    return response.data;
  },
};
