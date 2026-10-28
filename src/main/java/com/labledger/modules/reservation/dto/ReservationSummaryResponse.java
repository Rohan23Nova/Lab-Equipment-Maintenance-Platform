package com.labledger.modules.reservation.dto;

import com.labledger.modules.reservation.model.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public record ReservationSummaryResponse(
        UUID id,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        String laboratoryCode,
        UUID userId,
        String userFullName,
        Instant startTime,
        Instant endTime,
        String purpose,
        ReservationStatus status,
        Instant createdAt
) {}
