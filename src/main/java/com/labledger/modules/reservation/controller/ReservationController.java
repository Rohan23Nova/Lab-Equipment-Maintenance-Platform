package com.labledger.modules.reservation.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.common.dto.PageResponse;
import com.labledger.modules.reservation.dto.*;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@Tag(name = "Equipment Reservations", description = "Endpoints for scheduling, booking, availability inspection, and approvals")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Commission a new equipment reservation slot")
    public ResponseEntity<ApiResponse<ReservationResponse>> createReservation(
            @Valid @RequestBody CreateReservationRequest request,
            Authentication authentication
    ) {
        ReservationResponse response = reservationService.createReservation(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Reservation created successfully"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Browse and filter institutional equipment reservations")
    public ResponseEntity<ApiResponse<PageResponse<ReservationSummaryResponse>>> listReservations(
            @RequestParam(required = false) UUID equipmentId,
            @RequestParam(required = false) UUID userId,
            @RequestParam(required = false) ReservationStatus status,
            @RequestParam(required = false) Instant fromTime,
            @RequestParam(required = false) Instant toTime,
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable
    ) {
        var page = reservationService.browseAllReservations(equipmentId, userId, status, fromTime, toTime, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(page)));
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Inspect active and historical reservations for the authenticated user")
    public ResponseEntity<ApiResponse<PageResponse<ReservationSummaryResponse>>> getMyReservations(
            @RequestParam(required = false) ReservationStatus status,
            @PageableDefault(size = 15, sort = "startTime", direction = Sort.Direction.DESC) Pageable pageable,
            Authentication authentication
    ) {
        var page = reservationService.getUserReservations(authentication, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(page)));
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Retrieve pending reservation requests awaiting staff decision")
    public ResponseEntity<ApiResponse<PageResponse<ReservationSummaryResponse>>> getApprovalsQueue(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        var page = reservationService.getPendingApprovalsQueue(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.from(page)));
    }

    @GetMapping("/equipment/{equipmentId}/schedule")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Retrieve booked and active slots for an instrument within a specified time range")
    public ResponseEntity<ApiResponse<EquipmentScheduleResponse>> getEquipmentSchedule(
            @PathVariable UUID equipmentId,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to
    ) {
        Instant rangeStart = from != null ? from : Instant.now().truncatedTo(ChronoUnit.DAYS);
        Instant rangeEnd = to != null ? to : rangeStart.plus(7, ChronoUnit.DAYS);

        EquipmentScheduleResponse schedule = reservationService.getEquipmentSchedule(equipmentId, rangeStart, rangeEnd);
        return ResponseEntity.ok(ApiResponse.ok(schedule));
    }

    @GetMapping("/availability")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Pre-flight verification of slot availability before booking submission")
    public ResponseEntity<ApiResponse<AvailabilityCheckResponse>> checkAvailability(
            @RequestParam UUID equipmentId,
            @RequestParam Instant startTime,
            @RequestParam Instant endTime
    ) {
        AvailabilityCheckResponse availability = reservationService.checkSlotAvailability(equipmentId, startTime, endTime);
        return ResponseEntity.ok(ApiResponse.ok(availability));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Retrieve full reservation profile and decision audit metadata")
    public ResponseEntity<ApiResponse<ReservationResponse>> getReservationById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        ReservationResponse response = reservationService.getReservationById(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Approve a pending reservation request")
    public ResponseEntity<ApiResponse<ReservationResponse>> approveReservation(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        ReservationResponse response = reservationService.approveReservation(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Reservation approved successfully"));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Reject a pending reservation request with justification")
    public ResponseEntity<ApiResponse<ReservationResponse>> rejectReservation(
            @PathVariable UUID id,
            @Valid @RequestBody RejectReservationRequest request,
            Authentication authentication
    ) {
        ReservationResponse response = reservationService.rejectReservation(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Reservation rejected"));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Cancel an active reservation prior to elapsed interval")
    public ResponseEntity<ApiResponse<ReservationResponse>> cancelReservation(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) CancelReservationRequest request,
            Authentication authentication
    ) {
        ReservationResponse response = reservationService.cancelReservation(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Reservation cancelled successfully"));
    }
}
