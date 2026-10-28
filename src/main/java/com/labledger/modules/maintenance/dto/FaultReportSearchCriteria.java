package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;

import java.util.UUID;

public record FaultReportSearchCriteria(
        UUID equipmentId,
        UUID reportedById,
        FaultStatus status,
        FaultSeverity severity,
        String search
) {}
