package com.labledger.modules.notification.service;

import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.notification.dto.NotificationPreferenceResponse;
import com.labledger.modules.notification.dto.NotificationResponse;
import com.labledger.modules.notification.dto.UnreadCountResponse;
import com.labledger.modules.notification.dto.UpdatePreferencesRequest;
import com.labledger.modules.notification.model.Notification;
import com.labledger.modules.notification.model.NotificationChannel;
import com.labledger.modules.notification.model.NotificationPreference;
import com.labledger.modules.notification.model.NotificationType;
import com.labledger.modules.notification.repository.NotificationPreferenceRepository;
import com.labledger.modules.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final EmailNotificationService emailNotificationService;

    /**
     * Dispatches an in-app and optional email notification respecting recipient preferences
     * and idempotency constraints.
     */
    @Transactional
    public Optional<Notification> sendNotification(
            User recipient,
            NotificationType type,
            String title,
            String message,
            String navigationTarget,
            String idempotencyKey
    ) {
        if (recipient == null) {
            log.warn("Attempted to dispatch notification without recipient: {}", title);
            return Optional.empty();
        }

        // Idempotency check: prevent duplicate notifications across scheduler runs or restarts
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            if (notificationRepository.existsByIdempotencyKey(idempotencyKey)) {
                log.debug("Skipping duplicate notification with idempotency key: {}", idempotencyKey);
                return Optional.empty();
            }
        }

        // Retrieve or initialize user notification preferences
        NotificationPreference preferences = preferenceRepository.findByUserId(recipient.getId())
                .orElseGet(() -> preferenceRepository.save(NotificationPreference.defaultForUser(recipient)));

        // Evaluate preference filters
        if (!isNotificationPermittedByPreference(type, preferences)) {
            log.debug("Notification suppressed by user preferences: user={}, type={}", recipient.getEmail(), type);
            return Optional.empty();
        }

        Notification notification = null;
        if (preferences.isInAppEnabled()) {
            notification = Notification.builder()
                    .recipient(recipient)
                    .type(type)
                    .title(title)
                    .message(message)
                    .navigationTarget(navigationTarget)
                    .isRead(false)
                    .channel(NotificationChannel.IN_APP)
                    .idempotencyKey(idempotencyKey)
                    .build();

            notification = notificationRepository.save(notification);
            log.debug("In-app notification saved for {}: {}", recipient.getEmail(), title);
        }

        // Optional external email dispatch
        if (preferences.isEmailEnabled() && emailNotificationService.isEmailEnabled()) {
            emailNotificationService.sendEmail(recipient.getEmail(), title, message);
        }

        return Optional.ofNullable(notification);
    }

    /**
     * Send notification by recipient UUID directly.
     */
    @Transactional
    public Optional<Notification> sendNotification(
            UUID recipientId,
            NotificationType type,
            String title,
            String message,
            String navigationTarget,
            String idempotencyKey
    ) {
        return userRepository.findById(recipientId)
                .flatMap(recipient -> sendNotification(recipient, type, title, message, navigationTarget, idempotencyKey));
    }

    public Page<NotificationResponse> getNotifications(Authentication authentication, Boolean unreadOnly, Pageable pageable) {
        User user = resolveUser(authentication);
        Page<Notification> page = (unreadOnly != null && unreadOnly)
                ? notificationRepository.findByRecipientIdAndIsReadOrderByCreatedAtDesc(user.getId(), false, pageable)
                : notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId(), pageable);

        return page.map(NotificationResponse::fromEntity);
    }

    public UnreadCountResponse getUnreadCount(Authentication authentication) {
        User user = resolveUser(authentication);
        long count = notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
        return new UnreadCountResponse(count);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, Authentication authentication) {
        User user = resolveUser(authentication);
        Notification notification = notificationRepository.findByIdAndRecipientId(notificationId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId));

        if (!notification.isRead()) {
            notification.markAsRead();
            notification = notificationRepository.save(notification);
        }

        return NotificationResponse.fromEntity(notification);
    }

    @Transactional
    public UnreadCountResponse markAllAsRead(Authentication authentication) {
        User user = resolveUser(authentication);
        notificationRepository.markAllAsReadForRecipient(user.getId(), Instant.now());
        return new UnreadCountResponse(0);
    }

    public NotificationPreferenceResponse getPreferences(Authentication authentication) {
        User user = resolveUser(authentication);
        NotificationPreference preferences = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> preferenceRepository.save(NotificationPreference.defaultForUser(user)));

        return NotificationPreferenceResponse.fromEntity(preferences);
    }

    @Transactional
    public NotificationPreferenceResponse updatePreferences(UpdatePreferencesRequest request, Authentication authentication) {
        User user = resolveUser(authentication);
        NotificationPreference preferences = preferenceRepository.findByUserId(user.getId())
                .orElseGet(() -> NotificationPreference.defaultForUser(user));

        preferences.setEmailEnabled(request.emailEnabled());
        preferences.setInAppEnabled(request.inAppEnabled());
        preferences.setReservationReminders(request.reservationReminders());
        preferences.setReminderLeadHours(request.reminderLeadHours());
        preferences.setMaintenanceUpdates(request.maintenanceUpdates());
        preferences.setFaultAlerts(request.faultAlerts());

        NotificationPreference saved = preferenceRepository.save(preferences);
        return NotificationPreferenceResponse.fromEntity(saved);
    }

    private boolean isNotificationPermittedByPreference(NotificationType type, NotificationPreference pref) {
        return switch (type) {
            case RESERVATION_REMINDER -> pref.isReservationReminders();
            case FAULT_REPORTED, CRITICAL_FAULT_LOCKDOWN -> pref.isFaultAlerts();
            case WORK_ORDER_ASSIGNED, WORK_ORDER_COMPLETED, EQUIPMENT_RETURNED_TO_SERVICE, EQUIPMENT_STATUS_CHANGED ->
                    pref.isMaintenanceUpdates();
            default -> true;
        };
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User session required");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found: " + authentication.getName()));
    }
}
