package com.labledger.modules.maintenance.event;

import java.util.UUID;

public record WorkOrderAssignedEvent(
        UUID workOrderId,
        String workOrderNumber,
        UUID equipmentId,
        UUID technicianId,
        String title
) {}
