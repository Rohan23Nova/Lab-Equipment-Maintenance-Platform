package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;

import java.time.Instant;
import java.util.UUID;

public record FaultReportResponse(
        UUID id,
        String faultNumber,
        UUID equipmentId,
        String equipmentName,
        String equipmentAssetTag,
        String laboratoryName,
        UUID reportedById,
        String reportedByName,
        String reportedByEmail,
        String title,
        String description,
        FaultSeverity severity,
        FaultStatus status,
        Instant reportedAt,
        UUID triagedById,
        String triagedByName,
        Instant triagedAt,
        String triageNotes,
        UUID resolvedById,
        String resolvedByName,
        Instant resolvedAt,
        String resolutionDetails,
        UUID closedById,
        String closedByName,
        Instant closedAt,
        Instant createdAt,
        Instant updatedAt
) {}
