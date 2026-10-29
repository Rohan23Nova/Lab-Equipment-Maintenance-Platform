package com.labledger.modules.inventory.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.ExperimentDetailResponse;
import com.labledger.modules.inventory.dto.ExperimentSummaryResponse;
import com.labledger.modules.inventory.service.TeachingExperimentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/experiments")
@RequiredArgsConstructor
@Tag(name = "Curriculum Teaching Experiments", description = "Undergraduate practical laboratory experiments and required equipment linkages")
public class TeachingExperimentController {

    private final TeachingExperimentService experimentService;

    @GetMapping
    @Operation(summary = "List all teaching experiments", description = "Returns active curriculum practical experiments optionally filtered by subject or laboratory")
    public ResponseEntity<ApiResponse<List<ExperimentSummaryResponse>>> listExperiments(
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) UUID laboratoryId
    ) {
        List<ExperimentSummaryResponse> experiments = experimentService.getAllExperiments(subject, laboratoryId);
        return ResponseEntity.ok(ApiResponse.ok(experiments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get experiment details with required equipment", description = "Retrieves complete experiment profile, objectives, manual references, and linked instruments")
    public ResponseEntity<ApiResponse<ExperimentDetailResponse>> getExperimentById(@PathVariable UUID id) {
        ExperimentDetailResponse response = experimentService.getExperimentById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-equipment/{equipmentId}")
    @Operation(summary = "List experiments utilizing an equipment instrument", description = "Find all curriculum practical experiments that depend on a given physical instrument")
    public ResponseEntity<ApiResponse<List<ExperimentSummaryResponse>>> getExperimentsByEquipment(
            @PathVariable UUID equipmentId
    ) {
        List<ExperimentSummaryResponse> experiments = experimentService.getExperimentsByEquipmentId(equipmentId);
        return ResponseEntity.ok(ApiResponse.ok(experiments));
    }

    @GetMapping("/by-laboratory/{laboratoryId}")
    @Operation(summary = "List experiments conducted in a laboratory facility", description = "Find all experiments assigned to a specific laboratory bay")
    public ResponseEntity<ApiResponse<List<ExperimentSummaryResponse>>> getExperimentsByLaboratory(
            @PathVariable UUID laboratoryId
    ) {
        List<ExperimentSummaryResponse> experiments = experimentService.getExperimentsByLaboratoryId(laboratoryId);
        return ResponseEntity.ok(ApiResponse.ok(experiments));
    }
}
