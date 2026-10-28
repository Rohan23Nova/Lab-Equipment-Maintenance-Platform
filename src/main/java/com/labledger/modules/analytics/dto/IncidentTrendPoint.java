package com.labledger.modules.analytics.dto;

public record IncidentTrendPoint(
        String date,
        long reportedFaults,
        long criticalFaults,
        long completedRepairs
) {
}
