package com.labledger.modules.analytics.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.analytics.dto.DashboardMetricsResponse;
import com.labledger.modules.analytics.dto.EquipmentRepeatedFaultsDto;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.ReportFilterCriteria;
import com.labledger.modules.analytics.dto.UtilizationReport;
import com.labledger.modules.analytics.service.AnalyticsService;
import com.labledger.modules.analytics.service.CsvExportService;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics & Operational Reporting", description = "Aggregated operational metrics, role-tailored dashboards, and secure CSV exports")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final CsvExportService csvExportService;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    @Operation(summary = "Retrieve role-aware operational dashboard metrics and critical action alerts")
    public ResponseEntity<ApiResponse<DashboardMetricsResponse>> getDashboardMetrics(
            @RequestParam(required = false) Instant fromTimestamp,
            @RequestParam(required = false) Instant toTimestamp,
            @RequestParam(required = false) UUID laboratoryId,
            @RequestParam(required = false) UUID categoryId,
            Authentication authentication
    ) {
        User user = resolveUser(authentication);
        ReportFilterCriteria filter = new ReportFilterCriteria(fromTimestamp, toTimestamp, laboratoryId, categoryId, null);
        DashboardMetricsResponse response = analyticsService.getDashboardMetrics(user, filter);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/reports/inventory")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Generate inventory distribution summary report")
    public ResponseEntity<ApiResponse<InventoryDistributionReport>> getInventoryReport(
            @RequestParam(required = false) UUID laboratoryId,
            @RequestParam(required = false) UUID categoryId
    ) {
        ReportFilterCriteria filter = new ReportFilterCriteria(null, null, laboratoryId, categoryId, null);
        InventoryDistributionReport report = analyticsService.getInventoryDistributionReport(filter);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/reports/utilization")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "Generate equipment scheduling utilization report")
    public ResponseEntity<ApiResponse<UtilizationReport>> getUtilizationReport(
            @RequestParam(required = false) Instant fromTimestamp,
            @RequestParam(required = false) Instant toTimestamp,
            @RequestParam(required = false) UUID laboratoryId,
            @RequestParam(required = false) UUID categoryId
    ) {
        ReportFilterCriteria filter = new ReportFilterCriteria(fromTimestamp, toTimestamp, laboratoryId, categoryId, null);
        UtilizationReport report = analyticsService.getUtilizationReport(filter);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/reports/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Generate maintenance incident trends and MTTR turnaround report")
    public ResponseEntity<ApiResponse<MaintenanceTrendsReport>> getMaintenanceReport(
            @RequestParam(required = false) Instant fromTimestamp,
            @RequestParam(required = false) Instant toTimestamp
    ) {
        ReportFilterCriteria filter = new ReportFilterCriteria(fromTimestamp, toTimestamp, null, null, null);
        MaintenanceTrendsReport report = analyticsService.getMaintenanceTrendsReport(filter);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/reports/overdue-maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Retrieve listing of active work orders past planned completion date")
    public ResponseEntity<ApiResponse<List<OverdueWorkOrderReport>>> getOverdueMaintenanceReport() {
        List<OverdueWorkOrderReport> reports = analyticsService.getOverdueMaintenanceReport(null);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/reports/repeated-failures")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Retrieve equipment ranked by recurring incident count")
    public ResponseEntity<ApiResponse<List<EquipmentRepeatedFaultsDto>>> getRepeatedFailuresReport(
            @RequestParam(required = false) Instant fromTimestamp,
            @RequestParam(required = false) Instant toTimestamp
    ) {
        ReportFilterCriteria filter = new ReportFilterCriteria(fromTimestamp, toTimestamp, null, null, null);
        List<EquipmentRepeatedFaultsDto> reports = analyticsService.getRepeatedFailuresReport(filter);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @GetMapping("/reports/export/{reportType}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT', 'TECHNICIAN')")
    @Operation(summary = "Download safe CSV export for a reporting dimension with spreadsheet formula injection protection")
    public ResponseEntity<byte[]> exportReport(
            @PathVariable String reportType,
            @RequestParam(required = false) Instant fromTimestamp,
            @RequestParam(required = false) Instant toTimestamp,
            @RequestParam(required = false) UUID laboratoryId,
            @RequestParam(required = false) UUID categoryId
    ) {
        ReportFilterCriteria filter = new ReportFilterCriteria(fromTimestamp, toTimestamp, laboratoryId, categoryId, null);
        byte[] csvData;
        String filename;

        switch (reportType.toLowerCase()) {
            case "inventory":
                InventoryDistributionReport inv = analyticsService.getInventoryDistributionReport(filter);
                csvData = csvExportService.exportInventoryDistribution(inv);
                filename = "labledger-inventory-" + Instant.now().getEpochSecond() + ".csv";
                break;
            case "utilization":
                UtilizationReport utl = analyticsService.getUtilizationReport(filter);
                csvData = csvExportService.exportUtilization(utl);
                filename = "labledger-utilization-" + Instant.now().getEpochSecond() + ".csv";
                break;
            case "maintenance":
                MaintenanceTrendsReport mtr = analyticsService.getMaintenanceTrendsReport(filter);
                csvData = csvExportService.exportMaintenanceTrends(mtr);
                filename = "labledger-maintenance-trends-" + Instant.now().getEpochSecond() + ".csv";
                break;
            case "overdue-maintenance":
                List<OverdueWorkOrderReport> overdue = analyticsService.getOverdueMaintenanceReport(filter);
                csvData = csvExportService.exportOverdueWorkOrders(overdue);
                filename = "labledger-overdue-maintenance-" + Instant.now().getEpochSecond() + ".csv";
                break;
            case "repeated-failures":
                List<EquipmentRepeatedFaultsDto> failures = analyticsService.getRepeatedFailuresReport(filter);
                csvData = csvExportService.exportRepeatedFailures(failures);
                filename = "labledger-repeated-failures-" + Instant.now().getEpochSecond() + ".csv";
                break;
            default:
                throw new IllegalArgumentException("Unsupported report export dimension: " + reportType);
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(new MediaType("text", "csv", java.nio.charset.StandardCharsets.UTF_8))
                .body(csvData);
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new AccessDeniedException("User session required");
        }
        return userRepository.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new AccessDeniedException("Authenticated user not found: " + authentication.getName()));
    }
}
