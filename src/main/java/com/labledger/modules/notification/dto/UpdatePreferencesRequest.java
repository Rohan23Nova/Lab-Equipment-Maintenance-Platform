package com.labledger.modules.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record UpdatePreferencesRequest(
        @NotNull(message = "Email notifications toggle is required")
        Boolean emailEnabled,

        @NotNull(message = "In-app notifications toggle is required")
        Boolean inAppEnabled,

        @NotNull(message = "Reservation reminders toggle is required")
        Boolean reservationReminders,

        @NotNull(message = "Reminder lead hours is required")
        @Min(value = 1, message = "Reminder lead hours must be at least 1")
        @Max(value = 72, message = "Reminder lead hours cannot exceed 72")
        Integer reminderLeadHours,

        @NotNull(message = "Maintenance updates toggle is required")
        Boolean maintenanceUpdates,

        @NotNull(message = "Fault alerts toggle is required")
        Boolean faultAlerts
) {}
