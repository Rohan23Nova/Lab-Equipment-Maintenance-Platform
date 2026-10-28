package com.labledger.modules.analytics.service;

import com.labledger.modules.analytics.dto.CriticalActionItem;
import com.labledger.modules.analytics.dto.DashboardMetricsResponse;
import com.labledger.modules.analytics.dto.EquipmentRepeatedFaultsDto;
import com.labledger.modules.analytics.dto.EquipmentUtilizationDetail;
import com.labledger.modules.analytics.dto.IncidentTrendPoint;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.ReportFilterCriteria;
import com.labledger.modules.analytics.dto.UtilizationReport;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.repository.EquipmentRepository;
import com.labledger.modules.maintenance.model.FaultReport;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import com.labledger.modules.maintenance.model.MaintenanceWorkOrder;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
import com.labledger.modules.maintenance.repository.FaultReportRepository;
import com.labledger.modules.maintenance.repository.MaintenanceWorkOrderRepository;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AnalyticsService {

    private final EquipmentRepository equipmentRepository;
    private final ReservationRepository reservationRepository;
    private final FaultReportRepository faultReportRepository;
    private final MaintenanceWorkOrderRepository workOrderRepository;

    private static final List<ReservationStatus> UTILIZATION_STATUSES = List.of(
            ReservationStatus.APPROVED,
            ReservationStatus.COMPLETED
    );

    private static final List<FaultStatus> OPEN_FAULT_STATUSES = List.of(
            FaultStatus.OPEN,
            FaultStatus.TRIAGED,
            FaultStatus.IN_REPAIR
    );

    private static final List<WorkOrderStatus> ACTIVE_WORK_ORDER_STATUSES = List.of(
            WorkOrderStatus.CREATED,
            WorkOrderStatus.ASSIGNED,
            WorkOrderStatus.IN_PROGRESS,
            WorkOrderStatus.BLOCKED
    );

    public DashboardMetricsResponse getDashboardMetrics(User user, ReportFilterCriteria filter) {
        Instant now = Instant.now();
        Instant from = filter != null && filter.fromTimestamp() != null ? filter.fromTimestamp() : now.minus(Duration.ofDays(30));
        Instant to = filter != null && filter.toTimestamp() != null ? filter.toTimestamp() : now;
        UUID labId = filter != null ? filter.laboratoryId() : null;

        boolean isStaff = user.getRoles().contains(UserRole.ROLE_ADMIN) || user.getRoles().contains(UserRole.ROLE_LAB_ASSISTANT);
        boolean isTechnician = user.getRoles().contains(UserRole.ROLE_TECHNICIAN);
        boolean isStudent = user.getRoles().contains(UserRole.ROLE_STUDENT) && !isStaff && !isTechnician;

        String roleContext = isStaff ? "STAFF" : (isTechnician ? "TECHNICIAN" : "STUDENT");

        // Equipment metrics
        long totalActive = labId != null
                ? equipmentRepository.countByLaboratoryIdAndStatusNot(labId, EquipmentStatus.ARCHIVED)
                : equipmentRepository.countByStatusNot(EquipmentStatus.ARCHIVED);

        long unavailable = labId != null
                ? equipmentRepository.countByLaboratoryIdAndStatus(labId, EquipmentStatus.UNDER_MAINTENANCE)
                : equipmentRepository.countByStatus(EquipmentStatus.UNDER_MAINTENANCE);

        // Reservation metrics
        long pendingReservations;
        long upcomingReservations;
        if (isStudent) {
            pendingReservations = reservationRepository.countByUserIdAndStatus(user.getId(), ReservationStatus.PENDING);
            upcomingReservations = reservationRepository.countByUserIdAndStatusAndStartTimeAfter(user.getId(), ReservationStatus.APPROVED, now);
        } else {
            pendingReservations = reservationRepository.countByStatus(ReservationStatus.PENDING);
            upcomingReservations = reservationRepository.countByStatusAndStartTimeAfter(ReservationStatus.APPROVED, now);
        }

        // Fault metrics
        long openFaults;
        long criticalFaults;
        if (isStudent) {
            openFaults = faultReportRepository.countByReportedByIdAndStatusIn(user.getId(), OPEN_FAULT_STATUSES);
            criticalFaults = 0;
        } else {
            openFaults = faultReportRepository.countByStatusIn(OPEN_FAULT_STATUSES);
            criticalFaults = faultReportRepository.countByStatusInAndSeverity(OPEN_FAULT_STATUSES, FaultSeverity.CRITICAL);
        }

        // Work order metrics
        long activeWorkOrders;
        long overdueWorkOrders;
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        if (isStaff) {
            activeWorkOrders = workOrderRepository.countByStatusIn(ACTIVE_WORK_ORDER_STATUSES);
            overdueWorkOrders = workOrderRepository.countOverdueWorkOrders(today);
        } else if (isTechnician) {
            activeWorkOrders = workOrderRepository.countByAssignedTechnicianIdAndStatusIn(user.getId(), ACTIVE_WORK_ORDER_STATUSES);
            overdueWorkOrders = workOrderRepository.countOverdueWorkOrdersForTechnician(user.getId(), today);
        } else {
            activeWorkOrders = 0;
            overdueWorkOrders = 0;
        }

        // Utilization over window
        UtilizationReport utilization = calculateUtilization(from, to, labId, filter != null ? filter.categoryId() : null);

        // MTTR over window
        Double mttr = calculateMeanTimeToRepair(from, to);

        // Incident trends over window
        List<IncidentTrendPoint> trends = calculateIncidentTrends(from, to);

        // Top repeated failures
        List<EquipmentRepeatedFaultsDto> repeatedFailures = getRepeatedFailuresReport(from, to);

        // Critical actions queue
        List<CriticalActionItem> criticalActions = buildCriticalActions(user, isStaff, isTechnician, isStudent, now);

        return new DashboardMetricsResponse(
                roleContext,
                totalActive,
                unavailable,
                pendingReservations,
                upcomingReservations,
                openFaults,
                criticalFaults,
                activeWorkOrders,
                overdueWorkOrders,
                utilization.overallUtilizationPercentage(),
                utilization.totalCapacityHours(),
                utilization.totalBookedHours(),
                mttr,
                criticalActions,
                trends,
                repeatedFailures
        );
    }

    public InventoryDistributionReport getInventoryDistributionReport(ReportFilterCriteria filter) {
        long totalActive = equipmentRepository.countByStatusNot(EquipmentStatus.ARCHIVED);
        long totalArchived = equipmentRepository.countByStatus(EquipmentStatus.ARCHIVED);
        BigDecimal totalCost = equipmentRepository.sumPurchaseCostByStatusNot(EquipmentStatus.ARCHIVED);

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Object[] row : equipmentRepository.countGroupedByCategory(EquipmentStatus.ARCHIVED)) {
            byCategory.put((String) row[0], ((Number) row[1]).longValue());
        }

        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (Object[] row : equipmentRepository.countGroupedByStatus()) {
            byStatus.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Long> byCondition = new LinkedHashMap<>();
        for (Object[] row : equipmentRepository.countGroupedByCondition(EquipmentStatus.ARCHIVED)) {
            byCondition.put(row[0].toString(), ((Number) row[1]).longValue());
        }

        Map<String, Long> byLab = new LinkedHashMap<>();
        for (Object[] row : equipmentRepository.countGroupedByLaboratory(EquipmentStatus.ARCHIVED)) {
            byLab.put((String) row[0], ((Number) row[1]).longValue());
        }

        return new InventoryDistributionReport(
                totalActive,
                totalArchived,
                totalCost,
                byCategory,
                byStatus,
                byCondition,
                byLab
        );
    }

    public UtilizationReport getUtilizationReport(ReportFilterCriteria filter) {
        Instant from = filter != null && filter.fromTimestamp() != null
                ? filter.fromTimestamp()
                : Instant.now().minus(Duration.ofDays(30));
        Instant to = filter != null && filter.toTimestamp() != null
                ? filter.toTimestamp()
                : Instant.now();
        UUID labId = filter != null ? filter.laboratoryId() : null;
        UUID categoryId = filter != null ? filter.categoryId() : null;

        return calculateUtilization(from, to, labId, categoryId);
    }

    public MaintenanceTrendsReport getMaintenanceTrendsReport(ReportFilterCriteria filter) {
        Instant from = filter != null && filter.fromTimestamp() != null
                ? filter.fromTimestamp()
                : Instant.now().minus(Duration.ofDays(30));
        Instant to = filter != null && filter.toTimestamp() != null
                ? filter.toTimestamp()
                : Instant.now();

        List<FaultReport> faultsInPeriod = faultReportRepository.findFaultsBetween(from, to);
        List<MaintenanceWorkOrder> completedInPeriod = workOrderRepository.findCompletedWorkOrdersBetween(from, to);

        long totalFaults = faultsInPeriod.size();
        long criticalFaults = faultsInPeriod.stream().filter(f -> f.getSeverity() == FaultSeverity.CRITICAL).count();
        long openFaults = faultsInPeriod.stream().filter(f -> OPEN_FAULT_STATUSES.contains(f.getStatus())).count();
        long resolvedFaults = faultsInPeriod.stream().filter(f -> f.getStatus() == FaultStatus.RESOLVED || f.getStatus() == FaultStatus.CLOSED).count();
        long completedWorkOrders = completedInPeriod.size();

        BigDecimal partsCost = completedInPeriod.stream()
                .map(MaintenanceWorkOrder::getPartsCost)
                .filter(cost -> cost != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal laborHours = completedInPeriod.stream()
                .map(MaintenanceWorkOrder::getLaborHours)
                .filter(hours -> hours != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Double mttr = calculateMeanTimeToRepair(from, to);
        List<IncidentTrendPoint> dailyTrends = calculateIncidentTrends(from, to);

        return new MaintenanceTrendsReport(
                from,
                to,
                totalFaults,
                criticalFaults,
                openFaults,
                resolvedFaults,
                completedWorkOrders,
                partsCost,
                laborHours,
                mttr,
                dailyTrends
        );
    }

    public List<OverdueWorkOrderReport> getOverdueMaintenanceReport(ReportFilterCriteria filter) {
        LocalDate today = Instant.now().atZone(ZoneOffset.UTC).toLocalDate();
        List<MaintenanceWorkOrder> overdueOrders = workOrderRepository.findOverdueWorkOrders(today);

        List<OverdueWorkOrderReport> reports = new ArrayList<>();
        for (MaintenanceWorkOrder order : overdueOrders) {
            long daysOverdue = order.getPlannedCompletionDate() != null
                    ? Math.max(0, Duration.between(order.getPlannedCompletionDate().atStartOfDay(ZoneOffset.UTC), Instant.now().atZone(ZoneOffset.UTC)).toDays())
                    : 0;

            String technicianName = order.getAssignedTechnician() != null
                    ? order.getAssignedTechnician().getFirstName() + " " + order.getAssignedTechnician().getLastName()
                    : "Unassigned";

            reports.add(new OverdueWorkOrderReport(
                    order.getId(),
                    order.getWorkOrderNumber(),
                    order.getTitle(),
                    order.getEquipment() != null ? order.getEquipment().getAssetTag() : "N/A",
                    order.getEquipment() != null ? order.getEquipment().getName() : "N/A",
                    order.getEquipment() != null && order.getEquipment().getLaboratory() != null
                            ? order.getEquipment().getLaboratory().getName() : "N/A",
                    technicianName,
                    order.getPriority().name(),
                    order.getStatus().name(),
                    order.getPlannedCompletionDate(),
                    daysOverdue
            ));
        }

        return reports;
    }

    public List<EquipmentRepeatedFaultsDto> getRepeatedFailuresReport(ReportFilterCriteria filter) {
        Instant from = filter != null && filter.fromTimestamp() != null
                ? filter.fromTimestamp()
                : Instant.now().minus(Duration.ofDays(90));
        Instant to = filter != null && filter.toTimestamp() != null
                ? filter.toTimestamp()
                : Instant.now();

        return getRepeatedFailuresReport(from, to);
    }

    private List<EquipmentRepeatedFaultsDto> getRepeatedFailuresReport(Instant from, Instant to) {
        List<Object[]> rows = faultReportRepository.findEquipmentWithRepeatedFaults(from, to);
        List<EquipmentRepeatedFaultsDto> result = new ArrayList<>();

        for (Object[] row : rows) {
            UUID eqId = (UUID) row[0];
            String tag = (String) row[1];
            String name = (String) row[2];
            String lab = (String) row[3];
            String status = row[4].toString();
            long totalFaults = ((Number) row[5]).longValue();
            long criticalFaults = ((Number) row[6]).longValue();
            Instant lastDate = (Instant) row[7];

            result.add(new EquipmentRepeatedFaultsDto(
                    eqId,
                    tag,
                    name,
                    lab,
                    status,
                    totalFaults,
                    criticalFaults,
                    lastDate
            ));
        }

        return result;
    }

    private UtilizationReport calculateUtilization(Instant from, Instant to, UUID labId, UUID categoryId) {
        double windowHours = Math.max(0.0, Duration.between(from, to).toSeconds() / 3600.0);
        if (windowHours <= 0) {
            return new UtilizationReport(from, to, 0.0, 0.0, 0.0, Collections.emptyList());
        }

        List<Equipment> instruments = labId != null
                ? equipmentRepository.findByLaboratoryIdAndStatusNot(labId, EquipmentStatus.ARCHIVED)
                : equipmentRepository.findByStatusNot(EquipmentStatus.ARCHIVED);

        if (categoryId != null) {
            instruments = instruments.stream()
                    .filter(e -> e.getCategory() != null && categoryId.equals(e.getCategory().getId()))
                    .toList();
        }

        if (instruments.isEmpty()) {
            return new UtilizationReport(from, to, 0.0, 0.0, 0.0, Collections.emptyList());
        }

        List<Reservation> reservations = labId != null
                ? reservationRepository.findOverlappingReservationsByLaboratory(labId, from, to, UTILIZATION_STATUSES)
                : reservationRepository.findOverlappingReservations(from, to, UTILIZATION_STATUSES);

        // Group booked hours by equipment ID
        Map<UUID, Double> bookedHoursMap = new HashMap<>();
        Map<UUID, Long> countMap = new HashMap<>();

        for (Reservation r : reservations) {
            if (r.getEquipment() == null) continue;
            UUID eqId = r.getEquipment().getId();

            Instant overlapStart = r.getStartTime().isAfter(from) ? r.getStartTime() : from;
            Instant overlapEnd = r.getEndTime().isBefore(to) ? r.getEndTime() : to;

            if (overlapStart.isBefore(overlapEnd)) {
                double durationHours = Duration.between(overlapStart, overlapEnd).toSeconds() / 3600.0;
                bookedHoursMap.merge(eqId, durationHours, Double::sum);
                countMap.merge(eqId, 1L, Long::sum);
            }
        }

        List<EquipmentUtilizationDetail> details = new ArrayList<>();
        double totalBookedHours = 0.0;
        double totalCapacityHours = instruments.size() * windowHours;

        for (Equipment eq : instruments) {
            double booked = bookedHoursMap.getOrDefault(eq.getId(), 0.0);
            long count = countMap.getOrDefault(eq.getId(), 0L);
            double rate = Math.min(100.0, (booked / windowHours) * 100.0);
            double roundedRate = BigDecimal.valueOf(rate).setScale(2, RoundingMode.HALF_UP).doubleValue();

            details.add(new EquipmentUtilizationDetail(
                    eq.getId(),
                    eq.getAssetTag(),
                    eq.getName(),
                    eq.getLaboratory() != null ? eq.getLaboratory().getName() : "N/A",
                    windowHours,
                    BigDecimal.valueOf(booked).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                    roundedRate,
                    count
            ));

            totalBookedHours += booked;
        }

        double overallRate = totalCapacityHours > 0
                ? Math.min(100.0, (totalBookedHours / totalCapacityHours) * 100.0)
                : 0.0;
        double roundedOverallRate = BigDecimal.valueOf(overallRate).setScale(2, RoundingMode.HALF_UP).doubleValue();

        return new UtilizationReport(
                from,
                to,
                BigDecimal.valueOf(totalCapacityHours).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                BigDecimal.valueOf(totalBookedHours).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                roundedOverallRate,
                details
        );
    }

    private Double calculateMeanTimeToRepair(Instant from, Instant to) {
        List<MaintenanceWorkOrder> completed = workOrderRepository.findCompletedWorkOrdersBetween(from, to);
        if (completed.isEmpty()) {
            return null;
        }

        double totalHours = 0.0;
        int count = 0;

        for (MaintenanceWorkOrder order : completed) {
            Instant start = order.getActualStartTime() != null ? order.getActualStartTime() : order.getCreatedAt();
            Instant end = order.getActualCompletionTime();

            if (start != null && end != null && end.isAfter(start)) {
                totalHours += Duration.between(start, end).toSeconds() / 3600.0;
                count++;
            }
        }

        if (count == 0) {
            return null;
        }

        double avg = totalHours / count;
        return BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private List<IncidentTrendPoint> calculateIncidentTrends(Instant from, Instant to) {
        List<FaultReport> faults = faultReportRepository.findFaultsBetween(from, to);
        List<MaintenanceWorkOrder> completedOrders = workOrderRepository.findCompletedWorkOrdersBetween(from, to);

        Map<String, long[]> bucketMap = new LinkedHashMap<>();

        // Generate daily buckets across window (at most 31 points for clean sparklines)
        LocalDate startDate = from.atZone(ZoneOffset.UTC).toLocalDate();
        LocalDate endDate = to.atZone(ZoneOffset.UTC).toLocalDate();

        long days = Duration.between(from, to).toDays();
        int step = (int) Math.max(1, days / 30);

        for (LocalDate d = startDate; !d.isAfter(endDate); d = d.plusDays(step)) {
            bucketMap.put(d.toString(), new long[]{0L, 0L, 0L}); // reported, critical, completed
        }

        for (FaultReport f : faults) {
            String dateStr = f.getReportedAt().atZone(ZoneOffset.UTC).toLocalDate().toString();
            bucketMap.computeIfPresent(dateStr, (k, v) -> {
                v[0]++;
                if (f.getSeverity() == FaultSeverity.CRITICAL) {
                    v[1]++;
                }
                return v;
            });
        }

        for (MaintenanceWorkOrder w : completedOrders) {
            if (w.getActualCompletionTime() != null) {
                String dateStr = w.getActualCompletionTime().atZone(ZoneOffset.UTC).toLocalDate().toString();
                bucketMap.computeIfPresent(dateStr, (k, v) -> {
                    v[2]++;
                    return v;
                });
            }
        }

        List<IncidentTrendPoint> points = new ArrayList<>();
        for (Map.Entry<String, long[]> entry : bucketMap.entrySet()) {
            points.add(new IncidentTrendPoint(
                    entry.getKey(),
                    entry.getValue()[0],
                    entry.getValue()[1],
                    entry.getValue()[2]
            ));
        }

        return points;
    }

    private List<CriticalActionItem> buildCriticalActions(
            User user,
            boolean isStaff,
            boolean isTechnician,
            boolean isStudent,
            Instant now
    ) {
        List<CriticalActionItem> items = new ArrayList<>();

        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        if (isStaff) {
            // 1. Pending reservations
            List<Reservation> pending = reservationRepository.findTop5ByStatusOrderByCreatedAtAsc(ReservationStatus.PENDING);
            for (Reservation r : pending) {
                String userName = r.getUser() != null ? r.getUser().getFirstName() + " " + r.getUser().getLastName() : "User";
                items.add(new CriticalActionItem(
                        "act-res-" + r.getId(),
                        "PENDING_APPROVAL",
                        "WARNING",
                        "Pending Approval: " + (r.getEquipment() != null ? r.getEquipment().getName() : "Equipment"),
                        "Requested by " + userName + " for " + r.getPurpose(),
                        "/app/approvals",
                        r.getCreatedAt()
                ));
            }

            // 2. Critical open faults
            List<FaultReport> criticalFaults = faultReportRepository.findTop5ByStatusInAndSeverityOrderByReportedAtDesc(
                    OPEN_FAULT_STATUSES,
                    FaultSeverity.CRITICAL
            );
            for (FaultReport f : criticalFaults) {
                items.add(new CriticalActionItem(
                        "act-flt-" + f.getId(),
                        "CRITICAL_FAULT",
                        "CRITICAL",
                        "Critical Incident: " + f.getTitle(),
                        (f.getEquipment() != null ? f.getEquipment().getAssetTag() : "") + " requires safety inspection and work order dispatch.",
                        "/app/faults/" + f.getId(),
                        f.getReportedAt()
                ));
            }

            // 3. Overdue work orders
            List<MaintenanceWorkOrder> overdue = workOrderRepository.findOverdueWorkOrders(today);
            for (int i = 0; i < Math.min(5, overdue.size()); i++) {
                MaintenanceWorkOrder w = overdue.get(i);
                items.add(new CriticalActionItem(
                        "act-wo-" + w.getId(),
                        "OVERDUE_WORK_ORDER",
                        "CRITICAL",
                        "Overdue Maintenance: " + w.getWorkOrderNumber(),
                        "Planned by " + (w.getPlannedCompletionDate() != null ? w.getPlannedCompletionDate() : "N/A") + " - " + w.getTitle(),
                        "/app/work-orders/" + w.getId(),
                        w.getCreatedAt()
                ));
            }
        } else if (isTechnician) {
            List<MaintenanceWorkOrder> overdue = workOrderRepository.findOverdueWorkOrders(today);
            for (MaintenanceWorkOrder w : overdue) {
                if (w.getAssignedTechnician() != null && user.getId().equals(w.getAssignedTechnician().getId())) {
                    items.add(new CriticalActionItem(
                            "act-wo-" + w.getId(),
                            "OVERDUE_WORK_ORDER",
                            "CRITICAL",
                            "Overdue Assigned Order: " + w.getWorkOrderNumber(),
                            w.getTitle(),
                            "/app/work-orders/" + w.getId(),
                            w.getCreatedAt()
                    ));
                }
            }
        }

        return items;
    }
}
