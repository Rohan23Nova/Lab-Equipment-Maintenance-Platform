package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.FaultStatus;
import jakarta.validation.constraints.NotNull;

public record TriageFaultReportRequest(
        @NotNull(message = "New fault status is required")
        FaultStatus status,

        String triageNotes,

        Boolean placeUnderMaintenance
) {}
