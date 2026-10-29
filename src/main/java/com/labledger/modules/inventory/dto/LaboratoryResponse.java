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
        long totalEquipmentCount,
        long availableEquipmentCount,
        long experimentCount,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Backward-compatible constructor for existing tests and call sites
     */
    public LaboratoryResponse(
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
    ) {
        this(id, code, name, building, roomNumber, description, active, managerId, managerName, 0L, 0L, 0L, createdAt, updatedAt);
    }
}
