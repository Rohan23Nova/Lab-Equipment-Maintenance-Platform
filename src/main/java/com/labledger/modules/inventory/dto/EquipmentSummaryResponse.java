package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;

import java.time.Instant;
import java.util.UUID;

public record EquipmentSummaryResponse(
        UUID id,
        String assetTag,
        String name,
        String categoryName,
        UUID categoryId,
        String laboratoryName,
        String laboratoryCode,
        UUID laboratoryId,
        String manufacturer,
        String model,
        EquipmentCondition condition,
        EquipmentStatus status,
        Instant updatedAt
) {}
