package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MaintenanceWorkOrderSummaryResponse(
        UUID id,
        String workOrderNumber,
        UUID faultReportId,
        String faultReportNumber,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        UUID assignedTechnicianId,
        String assignedTechnicianName,
        String title,
        WorkOrderPriority priority,
        WorkOrderStatus status,
        LocalDate plannedCompletionDate,
        boolean passedInspection,
        Instant createdAt
) {}
