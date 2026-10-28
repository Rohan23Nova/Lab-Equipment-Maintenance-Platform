package com.labledger.modules.maintenance.event;

import java.util.UUID;

public record WorkOrderCompletedEvent(
        UUID workOrderId,
        String workOrderNumber,
        UUID equipmentId,
        UUID completedByTechnicianId,
        String resolutionSummary
) {}
