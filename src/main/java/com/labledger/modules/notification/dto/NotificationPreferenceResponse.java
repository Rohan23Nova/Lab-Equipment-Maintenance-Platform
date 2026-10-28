package com.labledger.modules.notification.dto;

import com.labledger.modules.notification.model.NotificationPreference;

import java.time.Instant;

public record NotificationPreferenceResponse(
        boolean emailEnabled,
        boolean inAppEnabled,
        boolean reservationReminders,
        int reminderLeadHours,
        boolean maintenanceUpdates,
        boolean faultAlerts,
        Instant updatedAt
) {
    public static NotificationPreferenceResponse fromEntity(NotificationPreference p) {
        return new NotificationPreferenceResponse(
                p.isEmailEnabled(),
                p.isInAppEnabled(),
                p.isReservationReminders(),
                p.getReminderLeadHours(),
                p.isMaintenanceUpdates(),
                p.isFaultAlerts(),
                p.getUpdatedAt()
        );
    }
}
