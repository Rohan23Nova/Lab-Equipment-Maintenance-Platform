package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record EquipmentResponse(
        UUID id,
        String assetTag,
        String name,
        EquipmentCategoryResponse category,
        LaboratoryResponse laboratory,
        String manufacturer,
        String model,
        String serialNumber,
        EquipmentCondition condition,
        EquipmentStatus status,
        LocalDate purchaseDate,
        BigDecimal purchaseCost,
        LocalDate warrantyExpiration,
        String description,
        String specifications,
        Instant createdAt,
        Instant updatedAt,
        List<EquipmentStatusHistoryResponse> statusHistory,
        List<EquipmentDocumentResponse> documents
) {}
