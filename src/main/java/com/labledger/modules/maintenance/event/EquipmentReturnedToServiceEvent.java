package com.labledger.modules.maintenance.event;

import java.util.UUID;

public record EquipmentReturnedToServiceEvent(
        UUID equipmentId,
        UUID workOrderId,
        UUID inspectedById,
        String inspectionNotes
) {}
