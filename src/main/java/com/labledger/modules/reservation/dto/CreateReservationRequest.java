package com.labledger.modules.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public record CreateReservationRequest(
        @NotNull(message = "Equipment ID is required")
        UUID equipmentId,

        @NotNull(message = "Reservation start time is required")
        Instant startTime,

        @NotNull(message = "Reservation end time is required")
        Instant endTime,

        @NotBlank(message = "Reservation purpose is required")
        @Size(max = 1000, message = "Reservation purpose must not exceed 1000 characters")
        String purpose
) {}
