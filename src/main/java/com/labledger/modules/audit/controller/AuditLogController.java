package com.labledger.modules.audit.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.audit.dto.AuditLogResponse;
import com.labledger.modules.audit.dto.AuditLogSearchCriteria;
import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.audit.service.AuditService;
import com.labledger.modules.inventory.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/audit-logs")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
@Tag(name = "Audit Logs", description = "Immutable institutional activity logs and audit trails")
public class AuditLogController {

    private final AuditService auditService;

    @GetMapping
    @Operation(summary = "Search and list institutional activity audit logs with filters")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> searchAuditLogs(
            @RequestParam(required = false) AuditEntityType entityType,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID actorId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant fromTimestamp,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant toTimestamp,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        AuditLogSearchCriteria criteria = new AuditLogSearchCriteria(
                entityType, action, actorId, search, fromTimestamp, toTimestamp
        );
        PageResponse<AuditLogResponse> response = PageResponse.from(
                auditService.searchAuditLogs(criteria, pageable)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Retrieve specific audit log entry by ID")
    public ResponseEntity<ApiResponse<AuditLogResponse>> getAuditLogById(@PathVariable UUID id) {
        AuditLogResponse response = auditService.getAuditLogById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/entity/{type}/{id}")
    @Operation(summary = "Retrieve complete audit history trail for a specific entity")
    public ResponseEntity<ApiResponse<PageResponse<AuditLogResponse>>> getEntityAuditHistory(
            @PathVariable AuditEntityType type,
            @PathVariable UUID id,
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<AuditLogResponse> response = PageResponse.from(
                auditService.getAuditHistoryForEntity(type, id, pageable)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
