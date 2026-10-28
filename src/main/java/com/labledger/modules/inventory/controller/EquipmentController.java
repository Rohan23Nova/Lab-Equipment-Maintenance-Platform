package com.labledger.modules.inventory.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.*;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.service.EquipmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/equipment")
@RequiredArgsConstructor
@Tag(name = "Equipment Inventory", description = "Endpoints for university laboratory instruments, search, and lifecycle transitions")
public class EquipmentController {

    private final EquipmentService equipmentService;

    @GetMapping
    @Operation(summary = "Search and filter equipment instruments with pagination")
    public ResponseEntity<ApiResponse<PageResponse<EquipmentSummaryResponse>>> listEquipment(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) UUID laboratoryId,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) EquipmentStatus status,
            @RequestParam(required = false) EquipmentCondition condition,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        EquipmentSearchCriteria criteria = new EquipmentSearchCriteria(query, laboratoryId, categoryId, status, condition);
        PageResponse<EquipmentSummaryResponse> page = equipmentService.findEquipment(criteria, pageable);
        return ResponseEntity.ok(ApiResponse.ok(page));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve detailed equipment profile, specifications, history, and attachments")
    public ResponseEntity<ApiResponse<EquipmentResponse>> getEquipmentById(@PathVariable UUID id) {
        EquipmentResponse equipment = equipmentService.getEquipmentById(id);
        return ResponseEntity.ok(ApiResponse.ok(equipment));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Commission and register a new equipment instrument")
    public ResponseEntity<ApiResponse<EquipmentResponse>> createEquipment(
            @Valid @RequestBody CreateEquipmentRequest request,
            Authentication authentication
    ) {
        EquipmentResponse created = equipmentService.createEquipment(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(created, "Equipment instrument registered into inventory successfully"));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Update equipment specifications, location, and parameters")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipment(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEquipmentRequest request,
            Authentication authentication
    ) {
        EquipmentResponse updated = equipmentService.updateEquipment(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Equipment specifications updated successfully"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Transition operational availability status with audit notes")
    public ResponseEntity<ApiResponse<EquipmentResponse>> updateEquipmentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody EquipmentStatusUpdateRequest request,
            Authentication authentication
    ) {
        EquipmentResponse updated = equipmentService.updateEquipmentStatus(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Equipment operational status transitioned successfully"));
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Archive and decommission equipment without destructive history loss")
    public ResponseEntity<ApiResponse<EquipmentResponse>> archiveEquipment(
            @PathVariable UUID id,
            @RequestParam(required = false, defaultValue = "Decommissioned from university service") String reason,
            Authentication authentication
    ) {
        EquipmentResponse archived = equipmentService.archiveEquipment(id, reason, authentication);
        return ResponseEntity.ok(ApiResponse.ok(archived, "Equipment archived successfully"));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Inspect equipment status change audit ledger")
    public ResponseEntity<ApiResponse<List<EquipmentStatusHistoryResponse>>> getEquipmentHistory(
            @PathVariable UUID id
    ) {
        List<EquipmentStatusHistoryResponse> history = equipmentService.getEquipmentHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @PostMapping("/{id}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Attach technical documentation, safety protocols, or calibration certificates")
    public ResponseEntity<ApiResponse<EquipmentDocumentResponse>> addDocument(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDocumentRequest request,
            Authentication authentication
    ) {
        EquipmentDocumentResponse doc = equipmentService.addDocument(id, request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(doc, "Document attached to equipment successfully"));
    }
}
