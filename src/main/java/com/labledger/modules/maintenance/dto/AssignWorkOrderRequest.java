package com.labledger.modules.maintenance.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record AssignWorkOrderRequest(
        @NotNull(message = "Technician user ID is required")
        UUID technicianId
) {}
