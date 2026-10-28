package com.labledger.modules.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record EquipmentRepeatedFaultsDto(
        UUID equipmentId,
        String assetTag,
        String equipmentName,
        String laboratoryName,
        String status,
        long faultCount,
        long criticalCount,
        Instant lastFaultDate
) {
}
