package com.labledger.modules.inventory.dto;

import com.labledger.modules.inventory.model.TeachingExperiment;

import java.util.UUID;

public record ExperimentSummaryResponse(
        UUID id,
        String code,
        String title,
        String subject,
        String objective,
        UUID laboratoryId,
        String laboratoryName,
        String laboratoryCode,
        String manualReference,
        boolean active,
        int equipmentCount
) {
    public static ExperimentSummaryResponse fromEntity(TeachingExperiment exp) {
        UUID labId = exp.getLaboratory() != null ? exp.getLaboratory().getId() : null;
        String labName = exp.getLaboratory() != null ? exp.getLaboratory().getName() : null;
        String labCode = exp.getLaboratory() != null ? exp.getLaboratory().getCode() : null;
        int count = exp.getRequiredEquipment() != null ? exp.getRequiredEquipment().size() : 0;

        return new ExperimentSummaryResponse(
                exp.getId(),
                exp.getCode(),
                exp.getTitle(),
                exp.getSubject(),
                exp.getObjective(),
                labId,
                labName,
                labCode,
                exp.getManualReference(),
                exp.isActive(),
                count
        );
    }
}
