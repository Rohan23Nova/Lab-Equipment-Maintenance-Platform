package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.WorkOrderPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateWorkOrderRequest(
        UUID faultReportId,

        @NotNull(message = "Target equipment instrument ID is required")
        UUID equipmentId,

        UUID assignedTechnicianId,

        @NotBlank(message = "Work order title is required")
        @Size(max = 200, message = "Work order title must not exceed 200 characters")
        String title,

        @NotBlank(message = "Detailed maintenance scope description is required")
        String description,

        @NotNull(message = "Priority level is required")
        WorkOrderPriority priority,

        LocalDate plannedStartDate,

        LocalDate plannedCompletionDate
) {}
