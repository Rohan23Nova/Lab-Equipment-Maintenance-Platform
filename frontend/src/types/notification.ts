export type NotificationType =
  | 'RESERVATION_SUBMITTED'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_CANCELLED'
  | 'RESERVATION_REMINDER'
  | 'FAULT_REPORTED'
  | 'CRITICAL_FAULT_LOCKDOWN'
  | 'WORK_ORDER_ASSIGNED'
  | 'WORK_ORDER_COMPLETED'
  | 'EQUIPMENT_RETURNED_TO_SERVICE'
  | 'EQUIPMENT_STATUS_CHANGED'
  | 'ADMIN_USER_UPDATED';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS';

export interface NotificationItem {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  navigationTarget?: string;
  isRead: boolean;
  readAt?: string;
  channel: NotificationChannel;
  createdAt: string;
}

export interface UnreadCount {
  count: number;
}

export interface NotificationPreferences {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  reservationReminders: boolean;
  reminderLeadHours: number;
  maintenanceUpdates: boolean;
  faultAlerts: boolean;
  updatedAt: string;
}

export interface UpdatePreferencesPayload {
  emailEnabled: boolean;
  inAppEnabled: boolean;
  reservationReminders: boolean;
  reminderLeadHours: number;
  maintenanceUpdates: boolean;
  faultAlerts: boolean;
}
