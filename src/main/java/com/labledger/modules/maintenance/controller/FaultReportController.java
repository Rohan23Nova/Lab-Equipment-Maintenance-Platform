package com.labledger.modules.maintenance.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import com.labledger.modules.maintenance.service.MaintenanceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/faults")
@RequiredArgsConstructor
@Tag(name = "Fault Reporting", description = "Endpoints for reporting, triaging, and tracking equipment fault conditions")
public class FaultReportController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Report an equipment fault condition")
    public ResponseEntity<ApiResponse<FaultReportResponse>> reportFault(
            @Valid @RequestBody CreateFaultReportRequest request,
            Authentication authentication
    ) {
        FaultReportResponse response = maintenanceService.reportFault(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Fault report successfully submitted and logged into the ledger"));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Browse and search fault reports")
    public ResponseEntity<ApiResponse<PageResponse<FaultReportSummaryResponse>>> findFaults(
            @RequestParam(required = false) UUID equipmentId,
            @RequestParam(required = false) UUID reportedById,
            @RequestParam(required = false) FaultStatus status,
            @RequestParam(required = false) FaultSeverity severity,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "reportedAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        FaultReportSearchCriteria criteria = new FaultReportSearchCriteria(
                equipmentId, reportedById, status, severity, search
        );
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PageResponse<FaultReportSummaryResponse> results = maintenanceService.findFaults(criteria, pageable);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get detailed fault report by ID")
    public ResponseEntity<ApiResponse<FaultReportResponse>> getFaultById(@PathVariable UUID id) {
        FaultReportResponse response = maintenanceService.getFaultById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/triage")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Triage a fault report and optionally place equipment under maintenance")
    public ResponseEntity<ApiResponse<FaultReportResponse>> triageFault(
            @PathVariable UUID id,
            @Valid @RequestBody TriageFaultReportRequest request,
            Authentication authentication
    ) {
        FaultReportResponse response = maintenanceService.triageFault(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fault report triage decision recorded"));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Mark a fault report as resolved with technical details")
    public ResponseEntity<ApiResponse<FaultReportResponse>> resolveFault(
            @PathVariable UUID id,
            @Valid @RequestBody ResolveFaultReportRequest request,
            Authentication authentication
    ) {
        FaultReportResponse response = maintenanceService.resolveFault(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fault report marked as resolved"));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Close a resolved fault report")
    public ResponseEntity<ApiResponse<FaultReportResponse>> closeFault(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        FaultReportResponse response = maintenanceService.closeFault(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Fault report successfully closed"));
    }
}
