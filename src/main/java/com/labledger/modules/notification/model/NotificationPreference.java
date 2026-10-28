package com.labledger.modules.notification.model;

import com.labledger.modules.auth.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "notification_preferences")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "email_enabled", nullable = false)
    @Builder.Default
    private boolean emailEnabled = true;

    @Column(name = "in_app_enabled", nullable = false)
    @Builder.Default
    private boolean inAppEnabled = true;

    @Column(name = "reservation_reminders", nullable = false)
    @Builder.Default
    private boolean reservationReminders = true;

    @Column(name = "reminder_lead_hours", nullable = false)
    @Builder.Default
    private int reminderLeadHours = 2;

    @Column(name = "maintenance_updates", nullable = false)
    @Builder.Default
    private boolean maintenanceUpdates = true;

    @Column(name = "fault_alerts", nullable = false)
    @Builder.Default
    private boolean faultAlerts = true;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    public static NotificationPreference defaultForUser(User user) {
        return NotificationPreference.builder()
                .user(user)
                .emailEnabled(true)
                .inAppEnabled(true)
                .reservationReminders(true)
                .reminderLeadHours(2)
                .maintenanceUpdates(true)
                .faultAlerts(true)
                .build();
    }
}
