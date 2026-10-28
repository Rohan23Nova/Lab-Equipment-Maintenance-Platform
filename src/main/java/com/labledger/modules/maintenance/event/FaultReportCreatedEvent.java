package com.labledger.modules.maintenance.event;

import com.labledger.modules.maintenance.model.FaultSeverity;

import java.util.UUID;

public record FaultReportCreatedEvent(
        UUID faultReportId,
        String faultNumber,
        UUID equipmentId,
        UUID reportedById,
        FaultSeverity severity,
        String title
) {}
