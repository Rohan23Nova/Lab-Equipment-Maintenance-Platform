package com.labledger.modules.maintenance.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ReturnToServiceRequest(
        @NotNull(message = "Inspection pass/fail flag is required")
        Boolean passedInspection,

        @NotBlank(message = "Inspection notes and validation findings are required")
        String inspectionNotes,

        Boolean returnEquipmentToAvailable
) {}
