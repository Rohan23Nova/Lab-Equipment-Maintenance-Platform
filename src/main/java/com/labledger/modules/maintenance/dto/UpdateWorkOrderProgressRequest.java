package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.WorkOrderStatus;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record UpdateWorkOrderProgressRequest(
        @NotNull(message = "Updated work order status is required")
        WorkOrderStatus status,

        String blockedReason,

        BigDecimal laborHours,

        BigDecimal partsCost,

        String resolutionSummary,

        String progressNote
) {}
