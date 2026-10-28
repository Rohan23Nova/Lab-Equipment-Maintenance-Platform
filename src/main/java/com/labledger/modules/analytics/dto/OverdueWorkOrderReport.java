package com.labledger.modules.analytics.dto;

import java.time.LocalDate;
import java.util.UUID;

public record OverdueWorkOrderReport(
        UUID workOrderId,
        String workOrderNumber,
        String title,
        String equipmentAssetTag,
        String equipmentName,
        String laboratoryName,
        String assignedTechnicianName,
        String priority,
        String status,
        LocalDate plannedCompletionDate,
        long daysOverdue
) {
}
