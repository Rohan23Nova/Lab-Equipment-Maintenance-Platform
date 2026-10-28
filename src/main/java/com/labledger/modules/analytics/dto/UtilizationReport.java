package com.labledger.modules.analytics.dto;

import java.time.Instant;
import java.util.List;

public record UtilizationReport(
        Instant fromTimestamp,
        Instant toTimestamp,
        double totalCapacityHours,
        double totalBookedHours,
        double overallUtilizationPercentage,
        List<EquipmentUtilizationDetail> details
) {
}
