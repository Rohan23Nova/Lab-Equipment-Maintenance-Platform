package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.TeachingExperiment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExperimentDetailResponse(
        UUID id,
        String code,
        String title,
        String subject,
        String objective,
        String description,
        UUID laboratoryId,
        String laboratoryName,
        String laboratoryCode,
        String manualReference,
        boolean active,
        List<EquipmentSummaryResponse> requiredEquipment,
        Instant createdAt,
        Instant updatedAt
) {
    public static ExperimentDetailResponse fromEntity(TeachingExperiment exp, List<EquipmentSummaryResponse> equipment) {
        UUID labId = exp.getLaboratory() != null ? exp.getLaboratory().getId() : null;
        String labName = exp.getLaboratory() != null ? exp.getLaboratory().getName() : null;
        String labCode = exp.getLaboratory() != null ? exp.getLaboratory().getCode() : null;

        return new ExperimentDetailResponse(
                exp.getId(),
                exp.getCode(),
                exp.getTitle(),
                exp.getSubject(),
                exp.getObjective(),
                exp.getDescription(),
                labId,
                labName,
                labCode,
                exp.getManualReference(),
                exp.isActive(),
                equipment,
                exp.getCreatedAt(),
                exp.getUpdatedAt()
        );
    }
}
