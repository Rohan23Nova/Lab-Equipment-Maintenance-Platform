package com.labledger.modules.analytics.dto;

import java.util.List;

public record DashboardMetricsResponse(
        String role,
        long totalActiveEquipment,
        long unavailableEquipment,
        long pendingReservations,
        long upcomingReservations,
        long openFaults,
        long criticalFaults,
        long activeWorkOrders,
        long overdueWorkOrders,
        Double overallUtilizationPercentage,
        double totalCapacityHours,
        double totalBookedHours,
        Double meanTimeToRepairHours,
        List<CriticalActionItem> criticalActions,
        List<IncidentTrendPoint> incidentTrends,
        List<EquipmentRepeatedFaultsDto> topRepeatedFailures
) {
}
