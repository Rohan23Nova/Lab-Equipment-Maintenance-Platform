package com.labledger.modules.reservation.event;

import java.util.UUID;

public record ReservationCancelledEvent(
        UUID reservationId,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        UUID userId,
        String userFullName,
        String userEmail,
        UUID cancelledById,
        String cancelledByName,
        String cancellationReason
) {}
