package com.labledger.modules.analytics.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record MaintenanceTrendsReport(
        Instant fromTimestamp,
        Instant toTimestamp,
        long totalFaults,
        long criticalFaults,
        long openFaults,
        long resolvedFaults,
        long completedWorkOrders,
        BigDecimal totalPartsCost,
        BigDecimal totalLaborHours,
        Double meanTimeToRepairHours,
        List<IncidentTrendPoint> dailyTrends
) {
}
