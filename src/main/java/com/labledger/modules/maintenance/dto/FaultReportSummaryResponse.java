package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;

import java.time.Instant;
import java.util.UUID;

public record FaultReportSummaryResponse(
        UUID id,
        String faultNumber,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        UUID reportedById,
        String reportedByName,
        String title,
        FaultSeverity severity,
        FaultStatus status,
        Instant reportedAt,
        Instant createdAt
) {}
