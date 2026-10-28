package com.labledger.modules.reservation.event;

import java.util.UUID;

public record ReservationRejectedEvent(
        UUID reservationId,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        UUID userId,
        String userFullName,
        String userEmail,
        UUID decisionById,
        String decisionByName,
        String rejectionReason
) {}
