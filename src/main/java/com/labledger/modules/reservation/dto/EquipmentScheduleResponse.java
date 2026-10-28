package com.labledger.modules.reservation.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EquipmentScheduleResponse(
        UUID equipmentId,
        String equipmentName,
        String assetTag,
        Instant rangeStart,
        Instant rangeEnd,
        List<TimeSlotResponse> activeSlots
) {}
