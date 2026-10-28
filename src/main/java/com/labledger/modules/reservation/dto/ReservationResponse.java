package com.labledger.modules.reservation.dto;

import com.labledger.modules.reservation.model.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        String laboratoryCode,
        UUID userId,
        String userFullName,
        String userEmail,
        Instant startTime,
        Instant endTime,
        String purpose,
        ReservationStatus status,
        UUID decisionByUserId,
        String decisionByUserName,
        Instant decisionAt,
        String rejectionReason,
        String cancellationReason,
        Instant createdAt,
        Instant updatedAt
) {}
