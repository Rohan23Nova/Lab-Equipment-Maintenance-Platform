package com.labledger.modules.reservation.dto;

import java.time.Instant;

public record AvailabilityCheckResponse(
        boolean available,
        String reason,
        Instant startTime,
        Instant endTime
) {}
