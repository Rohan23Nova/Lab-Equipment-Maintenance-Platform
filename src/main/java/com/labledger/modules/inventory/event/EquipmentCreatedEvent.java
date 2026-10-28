package com.labledger.modules.inventory.event;

import java.util.UUID;

public record EquipmentCreatedEvent(
        UUID equipmentId,
        String assetTag,
        String name,
        UUID laboratoryId,
        String laboratoryName,
        UUID actorId,
        String actorName
) {}
