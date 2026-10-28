package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentDocumentType;

import java.time.Instant;
import java.util.UUID;

public record EquipmentDocumentResponse(
        UUID id,
        String title,
        EquipmentDocumentType documentType,
        String fileName,
        String fileType,
        Long fileSize,
        String fileUrl,
        String uploadedByName,
        Instant createdAt
) {}
