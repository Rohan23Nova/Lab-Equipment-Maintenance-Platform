package com.labledger.modules.maintenance.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/work-orders")
@RequiredArgsConstructor
@Tag(name = "Maintenance Work Orders", description = "Endpoints for issuing, tracking, and executing repair work orders")
public class MaintenanceWorkOrderController {

    private final MaintenanceService maintenanceService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Issue a new maintenance work order")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> createWorkOrder(
            @Valid @RequestBody CreateWorkOrderRequest request,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.createWorkOrder(request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Maintenance work order successfully commissioned"));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Browse and search maintenance work orders")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceWorkOrderSummaryResponse>>> findWorkOrders(
            @RequestParam(required = false) UUID equipmentId,
            @RequestParam(required = false) UUID assignedTechnicianId,
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) WorkOrderPriority priority,
            @RequestParam(required = false) Boolean passedInspection,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") Sort.Direction direction
    ) {
        WorkOrderSearchCriteria criteria = new WorkOrderSearchCriteria(
                equipmentId, assignedTechnicianId, status, priority, passedInspection, search
        );
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
        PageResponse<MaintenanceWorkOrderSummaryResponse> results = maintenanceService.findWorkOrders(criteria, pageable);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Get task queue for current logged-in technician")
    public ResponseEntity<ApiResponse<PageResponse<MaintenanceWorkOrderSummaryResponse>>> getTechnicianTasks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            Authentication authentication
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        PageResponse<MaintenanceWorkOrderSummaryResponse> results = maintenanceService.getTechnicianWorkOrders(pageable, authentication);
        return ResponseEntity.ok(ApiResponse.ok(results));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get work order details by ID")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> getWorkOrderById(@PathVariable UUID id) {
        MaintenanceWorkOrderResponse response = maintenanceService.getWorkOrderById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Assign a technician to a work order")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> assignTechnician(
            @PathVariable UUID id,
            @Valid @RequestBody AssignWorkOrderRequest request,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.assignTechnician(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Technician assigned to work order"));
    }

    @PatchMapping("/{id}/start")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Commence active repair operations on a work order")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> startWorkOrder(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.startWorkOrder(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Work order marked as IN_PROGRESS"));
    }

    @PatchMapping("/{id}/progress")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Update progress, labor hours, parts cost, or blocker status")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> updateProgress(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkOrderProgressRequest request,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.updateWorkOrderProgress(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Work order progress updated"));
    }

    @PostMapping("/{id}/notes")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Append a progress note or diagnostic finding to the work order")
    public ResponseEntity<ApiResponse<WorkOrderNoteResponse>> addNote(
            @PathVariable UUID id,
            @Valid @RequestBody AddWorkOrderNoteRequest request,
            Authentication authentication
    ) {
        WorkOrderNoteResponse response = maintenanceService.addWorkOrderNote(id, request, authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "Progress note appended to work order ledger"));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('TECHNICIAN', 'ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Mark work order as completed (equipment stays in maintenance pending inspection)")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> completeWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteWorkOrderRequest request,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.completeWorkOrder(id, request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response, "Work order marked COMPLETED. Instrument remains UNDER_MAINTENANCE pending return-to-service inspection."));
    }

    @PostMapping("/{id}/return-to-service")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Inspect work and authorize return of equipment to active service")
    public ResponseEntity<ApiResponse<MaintenanceWorkOrderResponse>> returnToService(
            @PathVariable UUID id,
            @Valid @RequestBody ReturnToServiceRequest request,
            Authentication authentication
    ) {
        MaintenanceWorkOrderResponse response = maintenanceService.returnToService(id, request, authentication);
        String msg = Boolean.TRUE.equals(request.passedInspection())
                ? "Inspection passed. Equipment successfully returned to AVAILABLE service."
                : "Inspection rejected. Equipment retained in UNDER_MAINTENANCE.";
        return ResponseEntity.ok(ApiResponse.ok(response, msg));
    }

    @GetMapping("/equipment/{equipmentId}/history")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get maintenance work order history for a specific instrument")
    public ResponseEntity<ApiResponse<List<MaintenanceWorkOrderSummaryResponse>>> getEquipmentHistory(
            @PathVariable UUID equipmentId
    ) {
        List<MaintenanceWorkOrderSummaryResponse> history = maintenanceService.getEquipmentMaintenanceHistory(equipmentId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
