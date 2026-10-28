package com.labledger.modules.inventory.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.CreateLaboratoryRequest;
import com.labledger.modules.inventory.dto.LaboratoryResponse;
import com.labledger.modules.inventory.dto.UpdateLaboratoryRequest;
import com.labledger.modules.inventory.service.LaboratoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/laboratories")
@RequiredArgsConstructor
@Tag(name = "Laboratory Management", description = "Endpoints for university research bay and facility registry")
public class LaboratoryController {

    private final LaboratoryService laboratoryService;

    @GetMapping
    @Operation(summary = "List all laboratory facilities")
    public ResponseEntity<ApiResponse<List<LaboratoryResponse>>> listLaboratories(
            @RequestParam(required = false, defaultValue = "false") boolean activeOnly
    ) {
        List<LaboratoryResponse> labs = laboratoryService.getAllLaboratories(activeOnly);
        return ResponseEntity.ok(ApiResponse.ok(labs));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve laboratory details by identifier")
    public ResponseEntity<ApiResponse<LaboratoryResponse>> getLaboratoryById(@PathVariable UUID id) {
        LaboratoryResponse lab = laboratoryService.getLaboratoryById(id);
        return ResponseEntity.ok(ApiResponse.ok(lab));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Register a new laboratory facility")
    public ResponseEntity<ApiResponse<LaboratoryResponse>> createLaboratory(
            @Valid @RequestBody CreateLaboratoryRequest request
    ) {
        LaboratoryResponse created = laboratoryService.createLaboratory(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created, "Laboratory facility registered successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Update laboratory facility metadata and manager")
    public ResponseEntity<ApiResponse<LaboratoryResponse>> updateLaboratory(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLaboratoryRequest request
    ) {
        LaboratoryResponse updated = laboratoryService.updateLaboratory(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Laboratory facility updated successfully"));
    }
}
