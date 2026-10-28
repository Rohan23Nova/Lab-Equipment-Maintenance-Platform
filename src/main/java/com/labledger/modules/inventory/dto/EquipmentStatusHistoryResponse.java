package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentStatus;

import java.time.Instant;
import java.util.UUID;

public record EquipmentStatusHistoryResponse(
        UUID id,
        EquipmentStatus previousStatus,
        EquipmentStatus newStatus,
        String changedByName,
        String changedByEmail,
        String reason,
        String notes,
        Instant createdAt
) {}
