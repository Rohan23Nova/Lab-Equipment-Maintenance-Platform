package com.labledger.modules.inventory.event;

import java.util.UUID;

public record EquipmentArchivedEvent(
        UUID equipmentId,
        String assetTag,
        String name,
        String reason,
        UUID actorId,
        String actorName
) {}
