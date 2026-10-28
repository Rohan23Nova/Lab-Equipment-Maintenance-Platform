package com.labledger.modules.inventory.event;

import java.util.UUID;

public record EquipmentUpdatedEvent(
        UUID equipmentId,
        String assetTag,
        String name,
        UUID actorId,
        String actorName,
        String changesSummary
) {}
