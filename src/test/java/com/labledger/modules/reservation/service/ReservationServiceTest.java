package com.labledger.modules.reservation.service;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.model.EquipmentCategory;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.model.Laboratory;
import com.labledger.modules.inventory.service.EquipmentService;
import com.labledger.modules.reservation.config.ReservationPolicyProperties;
import com.labledger.modules.reservation.dto.CancelReservationRequest;
import com.labledger.modules.reservation.dto.CreateReservationRequest;
import com.labledger.modules.reservation.dto.RejectReservationRequest;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for reservation domain rules — no Spring context, no database.
 * All external collaborators are mocked via Mockito.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ReservationService — domain rule validation")
class ReservationServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private EquipmentService equipmentService;
    @Mock private UserRepository userRepository;
    @Mock private ReservationPolicyProperties policyProperties;
    @Mock private ApplicationEventPublisher eventPublisher;
    @Mock private Authentication authentication;

    @InjectMocks
    private ReservationService reservationService;

    private User student;
    private User labAssistant;
    private Equipment equipment;
    private UUID equipmentId;
    private UUID studentId;

    @BeforeEach
    void setUp() {
        studentId = UUID.randomUUID();
        equipmentId = UUID.randomUUID();

        Laboratory lab = new Laboratory();
        lab.setId(UUID.randomUUID());
        lab.setName("Physics Lab");
        lab.setCode("PHY-01");

        EquipmentCategory category = new EquipmentCategory();
        category.setId(UUID.randomUUID());
        category.setName("Spectrometers");

        student = User.builder()
                .id(studentId)
                .email("student@lab.edu")
                .firstName("Alice")
                .lastName("Test")
                .department("Physics")
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .status(UserStatus.ACTIVE)
                .passwordHash("hashed")
                .failedLoginAttempts(0)
                .build();

        labAssistant = User.builder()
                .id(UUID.randomUUID())
                .email("manager@lab.edu")
                .firstName("Bob")
                .lastName("Manager")
                .department("Lab Operations")
                .roles(Set.of(UserRole.ROLE_LAB_ASSISTANT))
                .status(UserStatus.ACTIVE)
                .passwordHash("hashed")
                .failedLoginAttempts(0)
                .build();

        equipment = Equipment.builder()
                .id(equipmentId)
                .assetTag("EQ-0001")
                .name("Spectrometer")
                .manufacturer("Agilent")
                .model("Cary 60")
                .category(category)
                .laboratory(lab)
                .condition(EquipmentCondition.GOOD)
                .status(EquipmentStatus.AVAILABLE)
                .build();

        // Default lenient policy stubs — keep tests focused on one rule each
        lenient().when(policyProperties.getMaxAdvanceDays()).thenReturn(30);
        lenient().when(policyProperties.getMinDurationMinutes()).thenReturn(30);
        lenient().when(policyProperties.getMaxDurationHours()).thenReturn(8);

        lenient().when(authentication.getName()).thenReturn(student.getEmail());
    }

    // ── Half-open interval validation ──────────────────────────────────────

    @Test
    @DisplayName("[start, end) — rejects when start == end (zero-length interval)")
    void createReservation_startEqualsEnd_throwsBusinessRule() {
        Instant t = Instant.now().plus(2, ChronoUnit.DAYS);
        var request = new CreateReservationRequest(equipmentId, t, t, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("start time must precede end time");
    }

    @Test
    @DisplayName("[start, end) — rejects when start is after end")
    void createReservation_startAfterEnd_throwsBusinessRule() {
        Instant start = Instant.now().plus(3, ChronoUnit.DAYS);
        Instant end   = Instant.now().plus(2, ChronoUnit.DAYS);
        var request = new CreateReservationRequest(equipmentId, start, end, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("start time must precede end time");
    }

    @Test
    @DisplayName("rejects reservation whose start is strictly in the past (beyond 60s clock-skew tolerance)")
    void createReservation_startInPast_throwsBusinessRule() {
        Instant pastStart = Instant.now().minus(10, ChronoUnit.MINUTES);
        Instant end       = Instant.now().plus(1, ChronoUnit.HOURS);
        var request = new CreateReservationRequest(equipmentId, pastStart, end, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("start time cannot be in the past");
    }

    @Test
    @DisplayName("rejects reservation beyond the booking horizon policy")
    void createReservation_beyondHorizon_throwsBusinessRule() {
        Instant farFuture = Instant.now().plus(60, ChronoUnit.DAYS);
        Instant end = farFuture.plus(1, ChronoUnit.HOURS);
        var request = new CreateReservationRequest(equipmentId, farFuture, end, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("days in advance");
    }

    @Test
    @DisplayName("rejects reservation shorter than minimum allowed duration")
    void createReservation_belowMinDuration_throwsBusinessRule() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end   = start.plus(10, ChronoUnit.MINUTES); // 10 min < 30 min minimum
        var request = new CreateReservationRequest(equipmentId, start, end, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("at least");
    }

    @Test
    @DisplayName("rejects reservation exceeding maximum allowed duration")
    void createReservation_exceedsMaxDuration_throwsBusinessRule() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end   = start.plus(9, ChronoUnit.HOURS); // 9 hrs > 8 hrs maximum
        var request = new CreateReservationRequest(equipmentId, start, end, "Testing");

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("cannot exceed");
    }

    // ── Equipment availability checks ───────────────────────────────────────

    @Test
    @DisplayName("rejects booking for non-existent equipment")
    void createReservation_equipmentNotFound_throwsNotFound() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end   = start.plus(2, ChronoUnit.HOURS);
        var request = new CreateReservationRequest(equipmentId, start, end, "Testing");

        // getReservableEquipment is called before resolveUser — no user repository stub needed
        when(equipmentService.getReservableEquipment(equipmentId))
                .thenThrow(new ResourceNotFoundException("Equipment not found"));

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    @DisplayName("rejects booking for equipment with UNDER_MAINTENANCE status")
    void createReservation_equipmentUnderMaintenance_throwsBusinessRule() {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end   = start.plus(2, ChronoUnit.HOURS);
        var request = new CreateReservationRequest(equipmentId, start, end, "Testing");

        // getReservableEquipment throws when equipment is under maintenance
        when(equipmentService.getReservableEquipment(equipmentId))
                .thenThrow(new BusinessRuleException("Equipment instrument 'EQ-0001' is currently under maintenance and unavailable for booking"));

        assertThatThrownBy(() -> reservationService.createReservation(request, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("maintenance");
    }

    // ── Self-approval guard ────────────────────────────────────────────────

    @Test
    @DisplayName("approving own reservation is forbidden (BusinessRuleException)")
    void approveReservation_ownReservation_throwsBusinessRule() {
        UUID reservationId = UUID.randomUUID();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .user(student)           // requester = student
                .equipment(equipment)
                .startTime(Instant.now().plus(1, ChronoUnit.DAYS))
                .endTime(Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .status(ReservationStatus.PENDING)
                .purpose("Self-service attempt")
                .build();

        // The approver is the same person who created the reservation
        when(authentication.getName()).thenReturn(student.getEmail());
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.approveReservation(reservationId, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("own reservation");
    }

    @Test
    @DisplayName("approving a non-PENDING reservation throws BusinessRuleException")
    void approveReservation_alreadyApproved_throwsBusinessRule() {
        UUID reservationId = UUID.randomUUID();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .user(student)
                .equipment(equipment)
                .startTime(Instant.now().plus(1, ChronoUnit.DAYS))
                .endTime(Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .status(ReservationStatus.APPROVED)  // already approved — status check fires before resolveUser
                .purpose("Double approval attempt")
                .build();

        // Status check fires before resolveUser — no need to stub authentication.getName()
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.approveReservation(reservationId, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PENDING");
    }

    // ── Cancellation state guard ────────────────────────────────────────────

    @Test
    @DisplayName("cancelling a COMPLETED reservation throws BusinessRuleException")
    void cancelReservation_completedReservation_throwsBusinessRule() {
        UUID reservationId = UUID.randomUUID();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .user(student)
                .equipment(equipment)
                .startTime(Instant.now().minus(4, ChronoUnit.HOURS))
                .endTime(Instant.now().minus(2, ChronoUnit.HOURS))
                .status(ReservationStatus.COMPLETED)
                .purpose("Already completed")
                .build();

        when(authentication.getName()).thenReturn(labAssistant.getEmail());
        when(userRepository.findByEmailIgnoreCase(labAssistant.getEmail())).thenReturn(Optional.of(labAssistant));
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

        var cancelRequest = new CancelReservationRequest("Changed plans");
        assertThatThrownBy(() -> reservationService.cancelReservation(reservationId, cancelRequest, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PENDING or APPROVED");
    }

    @Test
    @DisplayName("cancelling a CANCELLED reservation throws BusinessRuleException")
    void cancelReservation_alreadyCancelled_throwsBusinessRule() {
        UUID reservationId = UUID.randomUUID();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .user(student)
                .equipment(equipment)
                .startTime(Instant.now().plus(1, ChronoUnit.DAYS))
                .endTime(Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .status(ReservationStatus.CANCELLED)
                .purpose("Already cancelled")
                .build();

        when(authentication.getName()).thenReturn(student.getEmail());
        when(userRepository.findByEmailIgnoreCase(student.getEmail())).thenReturn(Optional.of(student));
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

        var cancelRequest = new CancelReservationRequest("Trying again");
        assertThatThrownBy(() -> reservationService.cancelReservation(reservationId, cancelRequest, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PENDING or APPROVED");
    }

    // ── Rejection state guard ────────────────────────────────────────────────

    @Test
    @DisplayName("rejecting an APPROVED reservation throws BusinessRuleException")
    void rejectReservation_nonPendingReservation_throwsBusinessRule() {
        UUID reservationId = UUID.randomUUID();

        Reservation reservation = Reservation.builder()
                .id(reservationId)
                .user(student)
                .equipment(equipment)
                .startTime(Instant.now().plus(1, ChronoUnit.DAYS))
                .endTime(Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS))
                .status(ReservationStatus.APPROVED)
                .purpose("Experiment")
                .build();

        // Status check happens before resolveUser — no need to stub userRepository
        when(reservationRepository.findById(reservationId)).thenReturn(Optional.of(reservation));

        var rejectRequest = new RejectReservationRequest("Cannot reject approved");
        assertThatThrownBy(() -> reservationService.rejectReservation(reservationId, rejectRequest, authentication))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("PENDING");
    }
}
