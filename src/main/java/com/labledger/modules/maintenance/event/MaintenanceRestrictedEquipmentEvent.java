package com.labledger.modules.maintenance.event;

import java.util.List;
import java.util.UUID;

public record MaintenanceRestrictedEquipmentEvent(
        UUID equipmentId,
        String reason,
        List<UUID> cancelledReservationIds
) {}
