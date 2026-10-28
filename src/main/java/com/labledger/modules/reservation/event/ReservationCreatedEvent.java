package com.labledger.modules.reservation.event;

import com.labledger.modules.reservation.model.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public record ReservationCreatedEvent(
        UUID reservationId,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        UUID userId,
        String userFullName,
        String userEmail,
        Instant startTime,
        Instant endTime,
        String purpose,
        ReservationStatus status
) {}
