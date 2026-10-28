package com.labledger.modules.notification.scheduler;

import com.labledger.modules.notification.model.NotificationPreference;
import com.labledger.modules.notification.model.NotificationType;
import com.labledger.modules.notification.repository.NotificationPreferenceRepository;
import com.labledger.modules.notification.repository.NotificationRepository;
import com.labledger.modules.notification.service.NotificationService;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ReservationReminderScheduler {

    private final ReservationRepository reservationRepository;
    private final NotificationService notificationService;
    private final NotificationPreferenceRepository preferenceRepository;
    private final NotificationRepository notificationRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'")
            .withZone(ZoneOffset.UTC);

    /**
     * Executes periodically to evaluate upcoming confirmed reservations and dispatch
     * automated in-app reminders based on recipient lead-time preferences.
     * Prevents duplicate deliveries via persistent idempotency keys.
     */
    @Scheduled(fixedDelayString = "${labledger.notifications.reminder-check-interval-ms:60000}")
    @Transactional
    public void processUpcomingReservationReminders() {
        Instant now = Instant.now();
        // Look ahead up to 72 hours for any user lead preferences
        Instant windowEnd = now.plus(Duration.ofHours(72));

        List<Reservation> upcoming = reservationRepository.findUpcomingReservationsForReminders(
                ReservationStatus.APPROVED, now, windowEnd
        );

        if (upcoming.isEmpty()) {
            return;
        }

        int dispatchedCount = 0;
        for (Reservation reservation : upcoming) {
            String idempotencyKey = "REMINDER_START_" + reservation.getId();

            // Fast-skip if duplicate reminder was already generated
            if (notificationRepository.existsByIdempotencyKey(idempotencyKey)) {
                continue;
            }

            NotificationPreference preference = preferenceRepository.findByUserId(reservation.getUser().getId())
                    .orElseGet(() -> NotificationPreference.defaultForUser(reservation.getUser()));

            if (!preference.isReservationReminders()) {
                continue;
            }

            Instant threshold = now.plus(Duration.ofHours(preference.getReminderLeadHours()));
            if (reservation.getStartTime().isBefore(threshold)) {
                String title = "Upcoming Reservation Reminder: " + reservation.getEquipment().getName();
                String message = String.format(
                        "Your confirmed reservation for instrument %s (%s) begins at %s. Please review safety guidelines prior to check-in.",
                        reservation.getEquipment().getName(),
                        reservation.getEquipment().getAssetTag(),
                        TIME_FORMATTER.format(reservation.getStartTime())
                );

                notificationService.sendNotification(
                        reservation.getUser(),
                        NotificationType.RESERVATION_REMINDER,
                        title,
                        message,
                        "/app/reservations",
                        idempotencyKey
                );
                dispatchedCount++;
            }
        }

        if (dispatchedCount > 0) {
            log.info("Dispatched {} upcoming reservation reminder(s)", dispatchedCount);
        }
    }
}
