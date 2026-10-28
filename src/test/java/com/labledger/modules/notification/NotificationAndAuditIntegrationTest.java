package com.labledger.modules.notification;

import com.labledger.modules.audit.dto.AuditLogSearchCriteria;
import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.audit.model.AuditLog;
import com.labledger.modules.audit.repository.AuditLogRepository;
import com.labledger.modules.audit.service.AuditService;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.dto.CreateEquipmentRequest;
import com.labledger.modules.inventory.dto.EquipmentResponse;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.repository.EquipmentCategoryRepository;
import com.labledger.modules.inventory.repository.LaboratoryRepository;
import com.labledger.modules.inventory.service.EquipmentService;
import com.labledger.modules.notification.dto.NotificationResponse;
import com.labledger.modules.notification.dto.UnreadCountResponse;
import com.labledger.modules.notification.dto.UpdatePreferencesRequest;
import com.labledger.modules.notification.model.Notification;
import com.labledger.modules.notification.model.NotificationType;
import com.labledger.modules.notification.repository.NotificationRepository;
import com.labledger.modules.notification.scheduler.ReservationReminderScheduler;
import com.labledger.modules.notification.service.NotificationService;
import com.labledger.modules.reservation.dto.CreateReservationRequest;
import com.labledger.modules.reservation.dto.ReservationResponse;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import com.labledger.modules.reservation.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class NotificationAndAuditIntegrationTest {

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private ReservationReminderScheduler reminderScheduler;

    @Autowired
    private AuditService auditService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private EquipmentService equipmentService;

    @Autowired
    private EquipmentCategoryRepository categoryRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private UserRepository userRepository;

    private User student;
    private User assistant;
    private User admin;
    private Authentication studentAuth;
    private Authentication assistantAuth;
    private Authentication adminAuth;
    private EquipmentResponse equipment;

    @BeforeEach
    void setUp() {
        student = userRepository.findByEmailIgnoreCase("student@university.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("student@university.edu")
                        .passwordHash("hash")
                        .firstName("Student")
                        .lastName("User")
                        .department("Physics")
                        .roles(Set.of(UserRole.ROLE_STUDENT))
                        .status(UserStatus.ACTIVE)
                        .failedLoginAttempts(0)
                        .build()));

        assistant = userRepository.findByEmailIgnoreCase("assistant@university.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("assistant@university.edu")
                        .passwordHash("hash")
                        .firstName("Sarah")
                        .lastName("Assistant")
                        .department("Physics")
                        .roles(Set.of(UserRole.ROLE_LAB_ASSISTANT))
                        .status(UserStatus.ACTIVE)
                        .failedLoginAttempts(0)
                        .build()));

        admin = userRepository.findByEmailIgnoreCase("admin@university.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("admin@university.edu")
                        .passwordHash("hash")
                        .firstName("Admin")
                        .lastName("User")
                        .department("Central IT")
                        .roles(Set.of(UserRole.ROLE_ADMIN))
                        .status(UserStatus.ACTIVE)
                        .failedLoginAttempts(0)
                        .build()));

        studentAuth = new UsernamePasswordAuthenticationToken(
                student.getEmail(), "cred", List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );
        assistantAuth = new UsernamePasswordAuthenticationToken(
                assistant.getEmail(), "cred", List.of(new SimpleGrantedAuthority("ROLE_LAB_ASSISTANT"))
        );
        adminAuth = new UsernamePasswordAuthenticationToken(
                admin.getEmail(), "cred", List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );

        UUID catId = categoryRepository.findAll().get(0).getId();
        UUID labId = laboratoryRepository.findAll().get(0).getId();

        String tag = "EQ-NOTIF-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        CreateEquipmentRequest eqReq = new CreateEquipmentRequest(
                tag,
                "Spectrometer for Notifications",
                catId,
                labId,
                "Horiba",
                "LabRAM HR",
                "SN-TEST-88",
                EquipmentCondition.EXCELLENT,
                EquipmentStatus.AVAILABLE,
                LocalDate.now(),
                new BigDecimal("85000.00"),
                LocalDate.now().plusYears(2),
                "Spectrometer",
                "{}"
        );
        equipment = equipmentService.createEquipment(eqReq, adminAuth);
    }

    @Test
    @DisplayName("Reservation creation and approval dispatches in-app notifications and writes audit log")
    void reservationLifecycle_triggersNotificationsAndAuditLogs() {
        Instant start = Instant.now().plus(Duration.ofDays(1));
        Instant end = start.plus(Duration.ofHours(2));

        // 1. Student creates reservation
        CreateReservationRequest createReq = new CreateReservationRequest(
                equipment.id(), start, end, "Raman analysis for notification test"
        );
        ReservationResponse reservation = reservationService.createReservation(createReq, studentAuth);

        // Verify in-app notification delivered to student
        UnreadCountResponse unread = notificationService.getUnreadCount(studentAuth);
        assertThat(unread.count()).isGreaterThanOrEqualTo(1);

        Page<NotificationResponse> studentNotifs = notificationService.getNotifications(studentAuth, true, PageRequest.of(0, 10));
        assertThat(studentNotifs.getContent()).anyMatch(n -> n.type() == NotificationType.RESERVATION_SUBMITTED);

        // 2. Staff approves reservation
        reservationService.approveReservation(reservation.id(), assistantAuth);

        // Verify student received approval notification
        Page<NotificationResponse> updatedNotifs = notificationService.getNotifications(studentAuth, false, PageRequest.of(0, 10));
        assertThat(updatedNotifs.getContent()).anyMatch(n -> n.type() == NotificationType.RESERVATION_APPROVED);

        // Mark first notification as read
        NotificationResponse firstNotif = updatedNotifs.getContent().get(0);
        NotificationResponse marked = notificationService.markAsRead(firstNotif.id(), studentAuth);
        assertThat(marked.isRead()).isTrue();
        assertThat(marked.readAt()).isNotNull();

        // Verify audit log captured RESERVATION_CREATED and RESERVATION_APPROVED
        AuditLogSearchCriteria criteria = new AuditLogSearchCriteria(
                AuditEntityType.RESERVATION, null, null, null, null, null
        );
        Page<com.labledger.modules.audit.dto.AuditLogResponse> logs = auditService.searchAuditLogs(criteria, PageRequest.of(0, 20));
        assertThat(logs.getContent()).anyMatch(l -> l.action() == AuditAction.RESERVATION_CREATED);
        assertThat(logs.getContent()).anyMatch(l -> l.action() == AuditAction.RESERVATION_APPROVED);
    }

    @Test
    @DisplayName("Reminder scheduler executes, dispatches notification, and enforces idempotency against duplicates")
    void reminderScheduler_dispatchesOnceAndEnforcesIdempotency() {
        // Create an approved reservation starting in 1 hour (within standard 2h lead time)
        Instant start = Instant.now().plus(Duration.ofMinutes(50));
        Instant end = start.plus(Duration.ofHours(1));

        Reservation res = Reservation.builder()
                .equipment(equipmentService.getReservableEquipment(equipment.id()))
                .user(student)
                .startTime(start)
                .endTime(end)
                .purpose("Upcoming session test")
                .status(ReservationStatus.APPROVED)
                .decisionByUser(assistant)
                .decisionAt(Instant.now())
                .build();
        res = reservationRepository.save(res);

        String idempotencyKey = "REMINDER_START_" + res.getId();

        // First run of scheduler
        reminderScheduler.processUpcomingReservationReminders();

        assertThat(notificationRepository.existsByIdempotencyKey(idempotencyKey)).isTrue();
        long countAfterFirstRun = notificationRepository.findAll().stream()
                .filter(n -> idempotencyKey.equals(n.getIdempotencyKey()))
                .count();
        assertThat(countAfterFirstRun).isEqualTo(1);

        // Second run of scheduler (simulating next cron trigger or restart)
        reminderScheduler.processUpcomingReservationReminders();

        long countAfterSecondRun = notificationRepository.findAll().stream()
                .filter(n -> idempotencyKey.equals(n.getIdempotencyKey()))
                .count();
        assertThat(countAfterSecondRun).isEqualTo(1); // Absolutely zero duplicate!
    }

    @Test
    @DisplayName("Notification preferences can be updated and are persisted correctly")
    void preferences_canBeUpdated() {
        UpdatePreferencesRequest updateReq = new UpdatePreferencesRequest(
                false, true, true, 4, true, false
        );

        var prefs = notificationService.updatePreferences(updateReq, studentAuth);
        assertThat(prefs.emailEnabled()).isFalse();
        assertThat(prefs.reminderLeadHours()).isEqualTo(4);
        assertThat(prefs.faultAlerts()).isFalse();

        var retrieved = notificationService.getPreferences(studentAuth);
        assertThat(retrieved.emailEnabled()).isFalse();
        assertThat(retrieved.reminderLeadHours()).isEqualTo(4);
    }

    @Test
    @DisplayName("AuditService redacts sensitive keys such as passwords, tokens, and secrets")
    void auditService_redactsSensitiveData() {
        String sensitivePayload = "{\"username\":\"alice\",\"password\":\"SuperSecret123!\",\"token\":\"jwt-token-val\"}";

        AuditLog log = auditService.recordAudit(
                student.getId(),
                "Alice",
                "alice@university.edu",
                AuditAction.USER_CREATED,
                AuditEntityType.USER,
                UUID.randomUUID(),
                "alice@university.edu",
                "User registration with sensitive payload",
                sensitivePayload,
                "127.0.0.1"
        );

        assertThat(log.getDetailsJson()).doesNotContain("SuperSecret123!");
        assertThat(log.getDetailsJson()).doesNotContain("jwt-token-val");
        assertThat(log.getDetailsJson()).contains("\"password\":\"[REDACTED]\"");
        assertThat(log.getDetailsJson()).contains("\"token\":\"[REDACTED]\"");
    }
}
