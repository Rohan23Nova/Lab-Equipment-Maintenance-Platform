package com.labledger.modules.analytics.service;

import com.labledger.modules.analytics.dto.EquipmentRepeatedFaultsDto;
import com.labledger.modules.analytics.dto.EquipmentUtilizationDetail;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.UtilizationReport;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@Service
public class CsvExportService {

    /**
     * Sanitizes cell values to prevent CSV formula injection (CWE-1236) and escapes RFC-4180 special characters.
     */
    public String escapeCsv(Object input) {
        if (input == null) {
            return "";
        }
        String text = input.toString();
        if (text.isEmpty()) {
            return "";
        }

        // Mitigate Spreadsheet Formula Injection: prefix vulnerable triggers with single-quote
        char firstChar = text.charAt(0);
        if (firstChar == '=' || firstChar == '+' || firstChar == '-' || firstChar == '@' || firstChar == '\t' || firstChar == '\r') {
            text = "'" + text;
        }

        // Escape internal quotes
        boolean needsQuotes = text.contains(",") || text.contains("\"") || text.contains("\n") || text.contains("\r");
        text = text.replace("\"", "\"\"");

        return needsQuotes ? "\"" + text + "\"" : text;
    }

    public byte[] exportInventoryDistribution(InventoryDistributionReport report) {
        StringBuilder sb = new StringBuilder();
        sb.append("Inventory Dimension,Segment,Asset Count\n");

        sb.append(escapeCsv("Summary")).append(",").append(escapeCsv("Total Active Instruments")).append(",").append(report.totalActive()).append("\n");
        sb.append(escapeCsv("Summary")).append(",").append(escapeCsv("Total Archived Instruments")).append(",").append(report.totalArchived()).append("\n");
        sb.append(escapeCsv("Summary")).append(",").append(escapeCsv("Total Capital Valuation")).append(",").append(report.totalPurchaseCost()).append("\n");

        for (Map.Entry<String, Long> entry : report.byCategory().entrySet()) {
            sb.append(escapeCsv("Category")).append(",")
                    .append(escapeCsv(entry.getKey())).append(",")
                    .append(entry.getValue()).append("\n");
        }

        for (Map.Entry<String, Long> entry : report.byStatus().entrySet()) {
            sb.append(escapeCsv("Status")).append(",")
                    .append(escapeCsv(entry.getKey())).append(",")
                    .append(entry.getValue()).append("\n");
        }

        for (Map.Entry<String, Long> entry : report.byCondition().entrySet()) {
            sb.append(escapeCsv("Condition")).append(",")
                    .append(escapeCsv(entry.getKey())).append(",")
                    .append(entry.getValue()).append("\n");
        }

        for (Map.Entry<String, Long> entry : report.byLaboratory().entrySet()) {
            sb.append(escapeCsv("Facility")).append(",")
                    .append(escapeCsv(entry.getKey())).append(",")
                    .append(entry.getValue()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportUtilization(UtilizationReport report) {
        StringBuilder sb = new StringBuilder();
        sb.append("Asset Tag,Instrument Name,Laboratory,Capacity Hours,Booked Hours,Utilization Rate (%),Completed Reservations\n");

        for (EquipmentUtilizationDetail row : report.details()) {
            sb.append(escapeCsv(row.assetTag())).append(",")
                    .append(escapeCsv(row.equipmentName())).append(",")
                    .append(escapeCsv(row.laboratoryName())).append(",")
                    .append(String.format("%.2f", row.capacityHours())).append(",")
                    .append(String.format("%.2f", row.bookedHours())).append(",")
                    .append(String.format("%.2f", row.utilizationPercentage())).append(",")
                    .append(row.completedReservationsCount()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportMaintenanceTrends(MaintenanceTrendsReport report) {
        StringBuilder sb = new StringBuilder();
        sb.append("Metric,Value\n");
        sb.append("Reporting Period Start,").append(escapeCsv(report.fromTimestamp())).append("\n");
        sb.append("Reporting Period End,").append(escapeCsv(report.toTimestamp())).append("\n");
        sb.append("Total Faults Reported,").append(report.totalFaults()).append("\n");
        sb.append("Critical Incidents,").append(report.criticalFaults()).append("\n");
        sb.append("Open Fault Backlog,").append(report.openFaults()).append("\n");
        sb.append("Resolved Faults,").append(report.resolvedFaults()).append("\n");
        sb.append("Completed Work Orders,").append(report.completedWorkOrders()).append("\n");
        sb.append("Total Parts Cost ($),").append(report.totalPartsCost()).append("\n");
        sb.append("Total Labor Hours,").append(report.totalLaborHours()).append("\n");
        sb.append("Mean Time To Repair (Hours),").append(report.meanTimeToRepairHours() != null ? String.format("%.2f", report.meanTimeToRepairHours()) : "N/A").append("\n");

        sb.append("\nDate,Reported Faults,Critical Faults,Completed Repairs\n");
        for (var point : report.dailyTrends()) {
            sb.append(escapeCsv(point.date())).append(",")
                    .append(point.reportedFaults()).append(",")
                    .append(point.criticalFaults()).append(",")
                    .append(point.completedRepairs()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportOverdueWorkOrders(List<OverdueWorkOrderReport> reports) {
        StringBuilder sb = new StringBuilder();
        sb.append("Work Order Number,Title,Asset Tag,Instrument Name,Facility,Assigned Technician,Priority,Status,Planned Completion,Days Overdue\n");

        for (OverdueWorkOrderReport row : reports) {
            sb.append(escapeCsv(row.workOrderNumber())).append(",")
                    .append(escapeCsv(row.title())).append(",")
                    .append(escapeCsv(row.equipmentAssetTag())).append(",")
                    .append(escapeCsv(row.equipmentName())).append(",")
                    .append(escapeCsv(row.laboratoryName())).append(",")
                    .append(escapeCsv(row.assignedTechnicianName())).append(",")
                    .append(escapeCsv(row.priority())).append(",")
                    .append(escapeCsv(row.status())).append(",")
                    .append(escapeCsv(row.plannedCompletionDate())).append(",")
                    .append(row.daysOverdue()).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportRepeatedFailures(List<EquipmentRepeatedFaultsDto> failures) {
        StringBuilder sb = new StringBuilder();
        sb.append("Asset Tag,Instrument Name,Facility,Current Status,Total Faults,Critical Incidents,Most Recent Incident (UTC)\n");

        for (EquipmentRepeatedFaultsDto row : failures) {
            sb.append(escapeCsv(row.assetTag())).append(",")
                    .append(escapeCsv(row.equipmentName())).append(",")
                    .append(escapeCsv(row.laboratoryName())).append(",")
                    .append(escapeCsv(row.status())).append(",")
                    .append(row.faultCount()).append(",")
                    .append(row.criticalCount()).append(",")
                    .append(escapeCsv(row.lastFaultDate())).append("\n");
        }

        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }
}
