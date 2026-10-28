package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEquipmentRequest(
        @NotBlank(message = "Asset tag is required")
        @Size(max = 100, message = "Asset tag must not exceed 100 characters")
        String assetTag,

        @NotBlank(message = "Equipment name is required")
        @Size(max = 200, message = "Equipment name must not exceed 200 characters")
        String name,

        @NotNull(message = "Category ID is required")
        UUID categoryId,

        @NotNull(message = "Laboratory ID is required")
        UUID laboratoryId,

        @NotBlank(message = "Manufacturer is required")
        @Size(max = 150, message = "Manufacturer must not exceed 150 characters")
        String manufacturer,

        @NotBlank(message = "Model is required")
        @Size(max = 150, message = "Model must not exceed 150 characters")
        String model,

        @Size(max = 150, message = "Serial number must not exceed 150 characters")
        String serialNumber,

        @NotNull(message = "Equipment condition is required")
        EquipmentCondition condition,

        EquipmentStatus status,

        LocalDate purchaseDate,

        @DecimalMin(value = "0.00", message = "Purchase cost must be non-negative")
        BigDecimal purchaseCost,

        LocalDate warrantyExpiration,

        String description,

        String specifications
) {}
