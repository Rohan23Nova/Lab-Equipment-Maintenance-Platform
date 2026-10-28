package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MaintenanceWorkOrderResponse(
        UUID id,
        String workOrderNumber,
        UUID faultReportId,
        String faultReportNumber,
        String faultReportTitle,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        UUID assignedTechnicianId,
        String assignedTechnicianName,
        String assignedTechnicianEmail,
        UUID createdById,
        String createdByName,
        String title,
        String description,
        WorkOrderPriority priority,
        WorkOrderStatus status,
        String blockedReason,
        LocalDate plannedStartDate,
        LocalDate plannedCompletionDate,
        Instant actualStartTime,
        Instant actualCompletionTime,
        BigDecimal laborHours,
        BigDecimal partsCost,
        String resolutionSummary,
        boolean passedInspection,
        UUID inspectedById,
        String inspectedByName,
        Instant inspectedAt,
        String inspectionNotes,
        List<WorkOrderNoteResponse> notes,
        Instant createdAt,
        Instant updatedAt
) {}
