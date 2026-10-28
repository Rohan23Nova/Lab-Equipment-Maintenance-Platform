package com.labledger.modules.analytics.dto;

import java.util.UUID;

public record EquipmentUtilizationDetail(
        UUID equipmentId,
        String assetTag,
        String equipmentName,
        String laboratoryName,
        double capacityHours,
        double bookedHours,
        double utilizationPercentage,
        long completedReservationsCount
) {
}
