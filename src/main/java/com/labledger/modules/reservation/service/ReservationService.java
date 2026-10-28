package com.labledger.modules.reservation.service;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.service.EquipmentService;
import com.labledger.modules.reservation.config.ReservationPolicyProperties;
import com.labledger.modules.reservation.dto.*;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import com.labledger.modules.reservation.repository.ReservationSpecifications;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final EquipmentService equipmentService;
    private final UserRepository userRepository;
    private final ReservationPolicyProperties policyProperties;

    private static final List<ReservationStatus> ACTIVE_STATUSES =
            List.of(ReservationStatus.PENDING, ReservationStatus.APPROVED);

    /**
     * Commission a new reservation booking request following half-open interval semantics [start, end)
     * and policy invariants.
     */
    @Transactional
    public ReservationResponse createReservation(CreateReservationRequest request, Authentication authentication) {
        Instant start = request.startTime();
        Instant end = request.endTime();

        // 1. Strict Interval validation: [start, end)
        if (!start.isBefore(end)) {
            throw new BusinessRuleException("Reservation start time must precede end time");
        }

        Instant now = Instant.now();
        // Tolerance for clock-skew / transmission delay (60 seconds)
        if (start.isBefore(now.minusSeconds(60))) {
            throw new BusinessRuleException("Reservation start time cannot be in the past");
        }

        // 2. Policy: Booking Horizon
        Instant maxHorizon = now.plus(Duration.ofDays(policyProperties.getMaxAdvanceDays()));
        if (start.isAfter(maxHorizon)) {
            throw new BusinessRuleException("Reservations cannot be booked more than " +
                    policyProperties.getMaxAdvanceDays() + " days in advance");
        }

        // 3. Policy: Slot Duration constraints
        Duration duration = Duration.between(start, end);
        if (duration.toMinutes() < policyProperties.getMinDurationMinutes()) {
            throw new BusinessRuleException("Reservation duration must be at least " +
                    policyProperties.getMinDurationMinutes() + " minutes");
        }
        if (duration.toHours() > policyProperties.getMaxDurationHours()) {
            throw new BusinessRuleException("Reservation duration cannot exceed " +
                    policyProperties.getMaxDurationHours() + " hours");
        }

        // 4. Equipment Availability & Status validation
        Equipment equipment = equipmentService.getReservableEquipment(request.equipmentId());

        // 5. Pre-check for overlapping active reservations
        boolean hasOverlap = reservationRepository.hasOverlappingReservations(
                equipment.getId(), start, end, ACTIVE_STATUSES
        );
        if (hasOverlap) {
            throw new ConflictException("The selected time slot overlaps with an existing reservation for this equipment");
        }

        // 6. User resolution
        User user = resolveUser(authentication);
        if (user == null) {
            throw new AccessDeniedException("Authenticated user context is required to reserve laboratory equipment");
        }

        // 7. Determine initial status based on role and policy
        boolean isStaff = user.getRoles().contains(UserRole.ROLE_ADMIN) ||
                user.getRoles().contains(UserRole.ROLE_LAB_ASSISTANT) ||
                user.getRoles().contains(UserRole.ROLE_FACULTY);

        ReservationStatus initialStatus = (isStaff && !policyProperties.isRequiresApprovalDefault())
                ? ReservationStatus.APPROVED
                : ReservationStatus.PENDING;

        Reservation reservation = Reservation.builder()
                .equipment(equipment)
                .user(user)
                .startTime(start)
                .endTime(end)
                .purpose(request.purpose().trim())
                .status(initialStatus)
                .decisionByUser(initialStatus == ReservationStatus.APPROVED ? user : null)
                .decisionAt(initialStatus == ReservationStatus.APPROVED ? now : null)
                .build();

        Reservation saved = reservationRepository.save(reservation);
        return toResponse(saved);
    }

    /**
     * Approve a pending reservation request. Users cannot approve their own requests.
     */
    @Transactional
    public ReservationResponse approveReservation(UUID reservationId, Authentication authentication) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessRuleException("Only PENDING reservations can be approved. Current status: " +
                    reservation.getStatus());
        }

        User staff = resolveUser(authentication);
        if (staff == null) {
            throw new AccessDeniedException("Authenticated staff credentials required");
        }

        // Invariant: User cannot approve their own reservation
        if (reservation.getUser().getId().equals(staff.getId())) {
            throw new BusinessRuleException("Staff members are not permitted to approve their own reservation requests");
        }

        // Re-verify equipment operational status
        equipmentService.getReservableEquipment(reservation.getEquipment().getId());

        // Re-verify slot availability
        boolean hasOverlap = reservationRepository.hasOverlappingReservationsExcluding(
                reservation.getEquipment().getId(),
                reservation.getId(),
                reservation.getStartTime(),
                reservation.getEndTime(),
                ACTIVE_STATUSES
        );
        if (hasOverlap) {
            throw new ConflictException("Cannot approve reservation: Conflicting slot already confirmed");
        }

        reservation.setStatus(ReservationStatus.APPROVED);
        reservation.setDecisionByUser(staff);
        reservation.setDecisionAt(Instant.now());
        reservation.setRejectionReason(null);

        Reservation updated = reservationRepository.save(reservation);
        return toResponse(updated);
    }

    /**
     * Reject a pending reservation request with recorded justification.
     */
    @Transactional
    public ReservationResponse rejectReservation(UUID reservationId, RejectReservationRequest request, Authentication authentication) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        if (reservation.getStatus() != ReservationStatus.PENDING) {
            throw new BusinessRuleException("Only PENDING reservations can be rejected. Current status: " +
                    reservation.getStatus());
        }

        User staff = resolveUser(authentication);
        reservation.setStatus(ReservationStatus.REJECTED);
        reservation.setRejectionReason(request.reason().trim());
        reservation.setDecisionByUser(staff);
        reservation.setDecisionAt(Instant.now());

        Reservation updated = reservationRepository.save(reservation);
        return toResponse(updated);
    }

    /**
     * Cancel an active reservation (PENDING or APPROVED) before scheduled completion.
     */
    @Transactional
    public ReservationResponse cancelReservation(UUID reservationId, CancelReservationRequest request, Authentication authentication) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", reservationId));

        User actor = resolveUser(authentication);
        if (actor == null) {
            throw new AccessDeniedException("Authenticated user context required");
        }

        boolean isOwner = reservation.getUser().getId().equals(actor.getId());
        boolean isStaff = actor.getRoles().contains(UserRole.ROLE_ADMIN) ||
                actor.getRoles().contains(UserRole.ROLE_LAB_ASSISTANT);

        if (!isOwner && !isStaff) {
            throw new AccessDeniedException("You do not have permission to cancel this reservation");
        }

        if (reservation.getStatus() != ReservationStatus.PENDING && reservation.getStatus() != ReservationStatus.APPROVED) {
            throw new BusinessRuleException("Only PENDING or APPROVED reservations can be cancelled. Current status: " +
                    reservation.getStatus());
        }

        if (Instant.now().isAfter(reservation.getEndTime())) {
            throw new BusinessRuleException("Cannot cancel a reservation whose scheduled interval has elapsed");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        String reason = (request != null && request.reason() != null && !request.reason().isBlank())
                ? request.reason().trim()
                : (isOwner ? "Cancelled by user" : "Cancelled by laboratory staff");
        reservation.setCancellationReason(reason);

        Reservation updated = reservationRepository.save(reservation);
        return toResponse(updated);
    }

    public ReservationResponse getReservationById(UUID id, Authentication authentication) {
        Reservation reservation = reservationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation", id));

        User actor = resolveUser(authentication);
        if (actor != null) {
            boolean isOwner = reservation.getUser().getId().equals(actor.getId());
            boolean isStaff = actor.getRoles().contains(UserRole.ROLE_ADMIN) ||
                    actor.getRoles().contains(UserRole.ROLE_LAB_ASSISTANT);
            if (!isOwner && !isStaff) {
                throw new AccessDeniedException("Access to reservation details denied");
            }
        }

        return toResponse(reservation);
    }

    public Page<ReservationSummaryResponse> getUserReservations(
            Authentication authentication,
            ReservationStatus status,
            Pageable pageable
    ) {
        User user = resolveUser(authentication);
        if (user == null) {
            throw new AccessDeniedException("Authenticated user context required");
        }

        Page<Reservation> page = (status == null)
                ? reservationRepository.findByUserIdOrderByStartTimeDesc(user.getId(), pageable)
                : reservationRepository.findByUserIdAndStatusOrderByStartTimeDesc(user.getId(), status, pageable);

        return page.map(this::toSummary);
    }

    public Page<ReservationSummaryResponse> getPendingApprovalsQueue(Pageable pageable) {
        return reservationRepository.findByStatusOrderByCreatedAtAsc(ReservationStatus.PENDING, pageable)
                .map(this::toSummary);
    }

    public Page<ReservationSummaryResponse> browseAllReservations(
            UUID equipmentId,
            UUID userId,
            ReservationStatus status,
            Instant fromTime,
            Instant toTime,
            Pageable pageable
    ) {
        Specification<Reservation> spec = Specification.where(ReservationSpecifications.forEquipment(equipmentId))
                .and(ReservationSpecifications.forUser(userId))
                .and(ReservationSpecifications.withStatus(status))
                .and(ReservationSpecifications.withinInterval(fromTime, toTime));

        return reservationRepository.findAll(spec, pageable).map(this::toSummary);
    }

    public EquipmentScheduleResponse getEquipmentSchedule(UUID equipmentId, Instant rangeStart, Instant rangeEnd) {
        Equipment equipment = equipmentService.getReservableEquipment(equipmentId);
        List<Reservation> activeReservations = reservationRepository.findActiveSlotsForEquipment(
                equipmentId, rangeStart, rangeEnd, ACTIVE_STATUSES
        );

        List<TimeSlotResponse> slots = activeReservations.stream()
                .map(r -> new TimeSlotResponse(
                        r.getId(),
                        r.getStartTime(),
                        r.getEndTime(),
                        r.getStatus(),
                        r.getUser().getFirstName() + " " + r.getUser().getLastName()
                ))
                .toList();

        return new EquipmentScheduleResponse(
                equipment.getId(),
                equipment.getName(),
                equipment.getAssetTag(),
                rangeStart,
                rangeEnd,
                slots
        );
    }

    public AvailabilityCheckResponse checkSlotAvailability(UUID equipmentId, Instant startTime, Instant endTime) {
        if (!startTime.isBefore(endTime)) {
            return new AvailabilityCheckResponse(false, "Start time must precede end time", startTime, endTime);
        }

        try {
            equipmentService.getReservableEquipment(equipmentId);
        } catch (BusinessRuleException ex) {
            return new AvailabilityCheckResponse(false, ex.getMessage(), startTime, endTime);
        }

        boolean hasOverlap = reservationRepository.hasOverlappingReservations(
                equipmentId, startTime, endTime, ACTIVE_STATUSES
        );

        if (hasOverlap) {
            return new AvailabilityCheckResponse(
                    false,
                    "The selected interval overlaps with a confirmed or pending reservation",
                    startTime,
                    endTime
            );
        }

        return new AvailabilityCheckResponse(true, "Slot is available for booking", startTime, endTime);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName()).orElse(null);
    }

    public ReservationResponse toResponse(Reservation r) {
        String decisionName = r.getDecisionByUser() != null
                ? r.getDecisionByUser().getFirstName() + " " + r.getDecisionByUser().getLastName()
                : null;

        return new ReservationResponse(
                r.getId(),
                r.getEquipment().getId(),
                r.getEquipment().getName(),
                r.getEquipment().getAssetTag(),
                r.getEquipment().getLaboratory().getName(),
                r.getEquipment().getLaboratory().getCode(),
                r.getUser().getId(),
                r.getUser().getFirstName() + " " + r.getUser().getLastName(),
                r.getUser().getEmail(),
                r.getStartTime(),
                r.getEndTime(),
                r.getPurpose(),
                r.getStatus(),
                r.getDecisionByUser() != null ? r.getDecisionByUser().getId() : null,
                decisionName,
                r.getDecisionAt(),
                r.getRejectionReason(),
                r.getCancellationReason(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }

    @Transactional
    public List<UUID> cancelFutureReservationsForMaintenance(UUID equipmentId, String reason, User actor) {
        List<Reservation> activeFuture = reservationRepository.findActiveSlotsForEquipment(
                equipmentId,
                Instant.now(),
                Instant.now().plus(Duration.ofDays(365)),
                ACTIVE_STATUSES
        );

        for (Reservation r : activeFuture) {
            r.setStatus(ReservationStatus.CANCELLED);
            r.setCancellationReason(reason != null ? reason : "Cancelled due to equipment maintenance");
        }
        reservationRepository.saveAll(activeFuture);
        return activeFuture.stream().map(Reservation::getId).toList();
    }

    public ReservationSummaryResponse toSummary(Reservation r) {
        return new ReservationSummaryResponse(
                r.getId(),
                r.getEquipment().getId(),
                r.getEquipment().getName(),
                r.getEquipment().getAssetTag(),
                r.getEquipment().getLaboratory().getName(),
                r.getEquipment().getLaboratory().getCode(),
                r.getUser().getId(),
                r.getUser().getFirstName() + " " + r.getUser().getLastName(),
                r.getStartTime(),
                r.getEndTime(),
                r.getPurpose(),
                r.getStatus(),
                r.getCreatedAt()
        );
    }
}
