package com.labledger.modules.inventory.event;

import com.labledger.modules.inventory.model.EquipmentStatus;

import java.util.UUID;

public record EquipmentStatusChangedEvent(
        UUID equipmentId,
        String assetTag,
        String name,
        EquipmentStatus previousStatus,
        EquipmentStatus newStatus,
        String reason,
        UUID actorId,
        String actorName
) {}
