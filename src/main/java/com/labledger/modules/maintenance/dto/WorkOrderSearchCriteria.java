package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;

import java.util.UUID;

public record WorkOrderSearchCriteria(
        UUID equipmentId,
        UUID assignedTechnicianId,
        WorkOrderStatus status,
        WorkOrderPriority priority,
        Boolean passedInspection,
        String search
) {}
