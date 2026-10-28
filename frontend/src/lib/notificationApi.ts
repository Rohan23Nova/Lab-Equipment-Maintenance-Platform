import { apiClient } from '@/lib/apiClient';
import { ApiResponse } from '@/types/api';
import { PageResponse } from '@/types/inventory';
import {
  NotificationItem,
  NotificationPreferences,
  UnreadCount,
  UpdatePreferencesPayload,
} from '@/types/notification';

export const notificationApi = {
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    page?: number;
    size?: number;
  }): Promise<PageResponse<NotificationItem>> => {
    const query = new URLSearchParams();
    if (params?.unreadOnly !== undefined) query.set('unreadOnly', String(params.unreadOnly));
    if (params?.page !== undefined) query.set('page', params.page.toString());
    if (params?.size !== undefined) query.set('size', params.size.toString());

    const qs = query.toString();
    const endpoint = `/notifications${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get<ApiResponse<PageResponse<NotificationItem>>>(endpoint);
    return response.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const response = await apiClient.get<ApiResponse<UnreadCount>>('/notifications/unread-count');
    return response.data.count;
  },

  markAsRead: async (id: string): Promise<NotificationItem> => {
    const response = await apiClient.patch<ApiResponse<NotificationItem>>(`/notifications/${id}/read`, {});
    return response.data;
  },

  markAllAsRead: async (): Promise<number> => {
    const response = await apiClient.post<ApiResponse<UnreadCount>>('/notifications/mark-all-read', {});
    return response.data.count;
  },

  getPreferences: async (): Promise<NotificationPreferences> => {
    const response = await apiClient.get<ApiResponse<NotificationPreferences>>('/notifications/preferences');
    return response.data;
  },

  updatePreferences: async (payload: UpdatePreferencesPayload): Promise<NotificationPreferences> => {
    const response = await apiClient.put<ApiResponse<NotificationPreferences>>('/notifications/preferences', payload);
    return response.data;
  },
};
