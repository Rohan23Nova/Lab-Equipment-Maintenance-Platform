package com.labledger.modules.reservation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RejectReservationRequest(
        @NotBlank(message = "Rejection explanation is required")
        @Size(max = 500, message = "Rejection explanation must not exceed 500 characters")
        String reason
) {}
