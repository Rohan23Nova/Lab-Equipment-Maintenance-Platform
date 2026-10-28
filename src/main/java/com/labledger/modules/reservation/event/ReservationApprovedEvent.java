package com.labledger.modules.reservation.event;

import java.time.Instant;
import java.util.UUID;

public record ReservationApprovedEvent(
        UUID reservationId,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        UUID userId,
        String userFullName,
        String userEmail,
        UUID decisionById,
        String decisionByName,
        Instant startTime,
        Instant endTime
) {}
