package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.NoteType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddWorkOrderNoteRequest(
        @NotNull(message = "Note category type is required")
        NoteType noteType,

        @NotBlank(message = "Progress note contents cannot be blank")
        String notes
) {}
