package com.labledger.modules.reservation.dto;

import com.labledger.modules.reservation.model.ReservationStatus;

import java.time.Instant;
import java.util.UUID;

public record TimeSlotResponse(
        UUID reservationId,
        Instant startTime,
        Instant endTime,
        ReservationStatus status,
        String bookedByName
) {}
