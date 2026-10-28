package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.FaultSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateFaultReportRequest(
        @NotNull(message = "Target equipment instrument ID is required")
        UUID equipmentId,

        @NotBlank(message = "Fault summary title is required")
        @Size(max = 200, message = "Fault title must not exceed 200 characters")
        String title,

        @NotBlank(message = "Detailed fault description is required")
        String description,

        @NotNull(message = "Severity level is required")
        FaultSeverity severity
) {}
