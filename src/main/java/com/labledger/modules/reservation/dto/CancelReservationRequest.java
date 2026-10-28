package com.labledger.modules.reservation.dto;

import jakarta.validation.constraints.Size;

public record CancelReservationRequest(
        @Size(max = 500, message = "Cancellation reason must not exceed 500 characters")
        String reason
) {}
