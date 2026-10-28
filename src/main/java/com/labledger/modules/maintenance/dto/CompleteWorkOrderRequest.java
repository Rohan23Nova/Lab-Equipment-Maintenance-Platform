package com.labledger.modules.maintenance.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record CompleteWorkOrderRequest(
        @NotBlank(message = "Resolution summary is required upon completion")
        String resolutionSummary,

        BigDecimal laborHours,

        BigDecimal partsCost
) {}
