package com.labledger.modules.inventory.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UpdateLaboratoryRequest(
        @NotBlank(message = "Laboratory name is required")
        @Size(max = 150, message = "Laboratory name must not exceed 150 characters")
        String name,

        @NotBlank(message = "Building location is required")
        @Size(max = 100, message = "Building location must not exceed 100 characters")
        String building,

        @NotBlank(message = "Room number is required")
        @Size(max = 50, message = "Room number must not exceed 50 characters")
        String roomNumber,

        String description,
        Boolean active,
        UUID managerId
) {}
