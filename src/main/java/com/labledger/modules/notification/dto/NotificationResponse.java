package com.labledger.modules.notification.dto;

import com.labledger.modules.notification.model.Notification;
import com.labledger.modules.notification.model.NotificationChannel;
import com.labledger.modules.notification.model.NotificationType;

import java.time.Instant;
import java.util.UUID;

public record NotificationResponse(
        UUID id,
        UUID recipientId,
        NotificationType type,
        String title,
        String message,
        String navigationTarget,
        boolean isRead,
        Instant readAt,
        NotificationChannel channel,
        Instant createdAt
) {
    public static NotificationResponse fromEntity(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getRecipient().getId(),
                n.getType(),
                n.getTitle(),
                n.getMessage(),
                n.getNavigationTarget(),
                n.isRead(),
                n.getReadAt(),
                n.getChannel(),
                n.getCreatedAt()
        );
    }
}
