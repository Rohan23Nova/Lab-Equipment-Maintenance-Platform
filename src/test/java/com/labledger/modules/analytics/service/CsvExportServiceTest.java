package com.labledger.modules.analytics.service;

import com.labledger.modules.analytics.dto.EquipmentRepeatedFaultsDto;
import com.labledger.modules.analytics.dto.EquipmentUtilizationDetail;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.UtilizationReport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class CsvExportServiceTest {

    private final CsvExportService csvExportService = new CsvExportService();

    @Test
    @DisplayName("Protects against spreadsheet formula injection by prepending single-quote")
    void escapeCsv_neutralizesFormulaInjectionTriggers() {
        assertThat(csvExportService.escapeCsv("=SUM(A1:A10)")).isEqualTo("'=SUM(A1:A10)");
        assertThat(csvExportService.escapeCsv("+123456")).isEqualTo("'+123456");
        assertThat(csvExportService.escapeCsv("-calc")).isEqualTo("'-calc");
        assertThat(csvExportService.escapeCsv("@SUM(1,2)")).isEqualTo("\"'@SUM(1,2)\"");
        assertThat(csvExportService.escapeCsv("\tcmd")).isEqualTo("'\tcmd");
    }

    @Test
    @DisplayName("Escapes internal double quotes and encloses comma-separated strings")
    void escapeCsv_rfc4180Compliant() {
        assertThat(csvExportService.escapeCsv("Standard, Text")).isEqualTo("\"Standard, Text\"");
        assertThat(csvExportService.escapeCsv("Equipment \"Precision\" Model")).isEqualTo("\"Equipment \"\"Precision\"\" Model\"");
        assertThat(csvExportService.escapeCsv(null)).isEqualTo("");
    }

    @Test
    @DisplayName("Exports inventory distribution report to valid CSV")
    void exportInventoryDistribution_generatesCsv() {
        InventoryDistributionReport report = new InventoryDistributionReport(
                10,
                2,
                BigDecimal.valueOf(150000.00),
                Map.of("Spectrometry", 5L),
                Map.of("AVAILABLE", 8L),
                Map.of("EXCELLENT", 6L),
                Map.of("Nanotech Lab", 10L)
        );

        byte[] bytes = csvExportService.exportInventoryDistribution(report);
        String csv = new String(bytes, StandardCharsets.UTF_8);

        assertThat(csv).contains("Inventory Dimension,Segment,Asset Count");
        assertThat(csv).contains("Total Active Instruments,10");
        assertThat(csv).contains("Spectrometry,5");
    }

    @Test
    @DisplayName("Exports utilization report to valid CSV")
    void exportUtilization_generatesCsv() {
        UtilizationReport report = new UtilizationReport(
                Instant.now().minusSeconds(86400),
                Instant.now(),
                240.0,
                120.0,
                50.0,
                List.of(new EquipmentUtilizationDetail(
                        UUID.randomUUID(),
                        "=EQ-001", // Potentially malicious tag
                        "Confocal Microscope",
                        "Imaging Suite",
                        24.0,
                        12.0,
                        50.0,
                        3
                ))
        );

        byte[] bytes = csvExportService.exportUtilization(report);
        String csv = new String(bytes, StandardCharsets.UTF_8);

        assertThat(csv).contains("Asset Tag,Instrument Name,Laboratory,Capacity Hours,Booked Hours,Utilization Rate (%),Completed Reservations");
        // Formula injection in asset tag is sanitized
        assertThat(csv).contains("'=EQ-001");
        assertThat(csv).contains("Confocal Microscope");
    }

    @Test
    @DisplayName("Exports overdue work orders with days overdue")
    void exportOverdueWorkOrders_generatesCsv() {
        List<OverdueWorkOrderReport> reports = List.of(
                new OverdueWorkOrderReport(
                        UUID.randomUUID(),
                        "WO-2026-001",
                        "Laser replacement",
                        "EQ-PHYS-01",
                        "Spectrometer",
                        "Optics Lab",
                        "David Kovacs",
                        "CRITICAL",
                        "IN_PROGRESS",
                        LocalDate.of(2026, 10, 1),
                        27
                )
        );

        byte[] bytes = csvExportService.exportOverdueWorkOrders(reports);
        String csv = new String(bytes, StandardCharsets.UTF_8);

        assertThat(csv).contains("Work Order Number,Title,Asset Tag,Instrument Name,Facility,Assigned Technician,Priority,Status,Planned Completion,Days Overdue");
        assertThat(csv).contains("WO-2026-001,Laser replacement,EQ-PHYS-01,Spectrometer,Optics Lab,David Kovacs,CRITICAL,IN_PROGRESS,2026-10-01,27");
    }
}
