package com.labledger.modules.maintenance.dto;

import com.labledger.modules.maintenance.model.NoteType;

import java.time.Instant;
import java.util.UUID;

public record WorkOrderNoteResponse(
        UUID id,
        UUID workOrderId,
        UUID authorId,
        String authorName,
        NoteType noteType,
        String notes,
        Instant createdAt
) {}
