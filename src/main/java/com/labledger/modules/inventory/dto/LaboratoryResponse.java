package com.labledger.modules.inventory.dto;

import java.time.Instant;
import java.util.UUID;

public record LaboratoryResponse(
        UUID id,
        String code,
        String name,
        String building,
        String roomNumber,
        String description,
        boolean active,
        UUID managerId,
        String managerName,
        Instant createdAt,
        Instant updatedAt
) {}
