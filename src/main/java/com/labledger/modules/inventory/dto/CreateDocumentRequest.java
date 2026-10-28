package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.EquipmentDocumentType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotBlank(message = "Document title is required")
        @Size(max = 200, message = "Title must not exceed 200 characters")
        String title,

        @NotNull(message = "Document type is required")
        EquipmentDocumentType documentType,

        @NotBlank(message = "File name is required")
        String fileName,

        @NotBlank(message = "File type is required")
        String fileType,

        @NotNull(message = "File size is required")
        @Min(value = 1, message = "File size must be greater than zero")
        Long fileSize,

        @NotBlank(message = "File URL or path is required")
        String fileUrl
) {}
