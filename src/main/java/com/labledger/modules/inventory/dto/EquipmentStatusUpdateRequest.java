package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record EquipmentStatusUpdateRequest(
        @NotNull(message = "New operational status is required")
        EquipmentStatus status,

        @Size(max = 255, message = "Reason must not exceed 255 characters")
        String reason,

        String notes
) {}
