package com.labledger.modules.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record EquipmentCategoryResponse(
        UUID id,
        String code,
        String name,
        String description,
        Instant createdAt
) {}
