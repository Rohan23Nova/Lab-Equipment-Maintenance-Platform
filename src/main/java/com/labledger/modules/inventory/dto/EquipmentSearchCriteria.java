package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;

import java.util.UUID;

public record EquipmentSearchCriteria(
        String query,
        UUID laboratoryId,
        UUID categoryId,
        EquipmentStatus status,
        EquipmentCondition condition
) {}
