package com.labledger.modules.maintenance.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveFaultReportRequest(
        @NotBlank(message = "Resolution details are required")
        String resolutionDetails
) {}
