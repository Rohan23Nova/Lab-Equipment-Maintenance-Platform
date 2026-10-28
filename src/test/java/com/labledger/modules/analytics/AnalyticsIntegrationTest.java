package com.labledger.modules.analytics;

import com.labledger.modules.analytics.dto.DashboardMetricsResponse;
import com.labledger.modules.analytics.dto.EquipmentRepeatedFaultsDto;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.ReportFilterCriteria;
import com.labledger.modules.analytics.dto.UtilizationReport;
import com.labledger.modules.analytics.service.AnalyticsService;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.model.EquipmentCategory;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.model.Laboratory;
import com.labledger.modules.inventory.repository.EquipmentCategoryRepository;
import com.labledger.modules.inventory.repository.EquipmentRepository;
import com.labledger.modules.inventory.repository.LaboratoryRepository;
import com.labledger.modules.maintenance.model.FaultReport;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import com.labledger.modules.maintenance.model.MaintenanceWorkOrder;
import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
import com.labledger.modules.maintenance.repository.FaultReportRepository;
import com.labledger.modules.maintenance.repository.MaintenanceWorkOrderRepository;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class AnalyticsIntegrationTest {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private EquipmentCategoryRepository categoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private FaultReportRepository faultReportRepository;

    @Autowired
    private MaintenanceWorkOrderRepository workOrderRepository;

    private Laboratory lab;
    private EquipmentCategory category;
    private User staffUser;
    private User studentUser;
    private User technicianUser;
    private Equipment instrumentA;
    private Equipment instrumentB;

    @BeforeEach
    void setUp() {
        staffUser = userRepository.save(User.builder()
                .email("analyst-staff-" + UUID.randomUUID() + "@university.edu")
                .passwordHash("hashed")
                .firstName("Sarah")
                .lastName("Analyst")
                .department("Operations")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_ADMIN, UserRole.ROLE_LAB_ASSISTANT))
                .build());

        studentUser = userRepository.save(User.builder()
                .email("analyst-student-" + UUID.randomUUID() + "@university.edu")
                .passwordHash("hashed")
                .firstName("Leo")
                .lastName("Student")
                .department("Chemistry")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .build());

        technicianUser = userRepository.save(User.builder()
                .email("analyst-tech-" + UUID.randomUUID() + "@university.edu")
                .passwordHash("hashed")
                .firstName("Marcus")
                .lastName("Tech")
                .department("Engineering")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_TECHNICIAN))
                .build());

        lab = laboratoryRepository.save(Laboratory.builder()
                .name("Analytics Test Facility " + UUID.randomUUID())
                .code("LAB-ANL-" + UUID.randomUUID().toString().substring(0, 6))
                .building("Science Block C")
                .roomNumber("C-204")
                .active(true)
                .manager(staffUser)
                .build());

        category = categoryRepository.save(EquipmentCategory.builder()
                .code("CAT-SPEC-" + UUID.randomUUID().toString().substring(0, 4))
                .name("Spectrometry " + UUID.randomUUID().toString().substring(0, 6))
                .description("Analytical spectrometers")
                .build());

        instrumentA = equipmentRepository.save(Equipment.builder()
                .assetTag("EQ-ANL-001-" + UUID.randomUUID().toString().substring(0, 6))
                .name("High-Resolution Mass Spectrometer")
                .laboratory(lab)
                .category(category)
                .manufacturer("Thermo Fisher")
                .model("Orbitrap Exploris")
                .condition(EquipmentCondition.EXCELLENT)
                .status(EquipmentStatus.AVAILABLE)
                .purchaseCost(BigDecimal.valueOf(250000.00))
                .purchaseDate(LocalDate.of(2025, 1, 15))
                .build());

        instrumentB = equipmentRepository.save(Equipment.builder()
                .assetTag("EQ-ANL-002-" + UUID.randomUUID().toString().substring(0, 6))
                .name("FTIR Spectrometer")
                .laboratory(lab)
                .category(category)
                .manufacturer("Bruker")
                .model("Alpha II")
                .condition(EquipmentCondition.FAIR)
                .status(EquipmentStatus.UNDER_MAINTENANCE)
                .purchaseCost(BigDecimal.valueOf(85000.00))
                .purchaseDate(LocalDate.of(2025, 3, 10))
                .build());
    }

    @Test
    @DisplayName("Dashboard metrics calculate correct real-time totals and exclude cancelled bookings")
    void getDashboardMetrics_calculatesCorrectTotals() {
        Instant now = Instant.now();
        Instant windowStart = now.minus(Duration.ofDays(7));
        Instant windowEnd = now.plus(Duration.ofDays(7));

        // 1. Approved reservation of 4 hours
        reservationRepository.save(Reservation.builder()
                .equipment(instrumentA)
                .user(studentUser)
                .startTime(now.minus(Duration.ofHours(5)))
                .endTime(now.minus(Duration.ofHours(1))) // 4 hours
                .purpose("Peptide profiling")
                .status(ReservationStatus.APPROVED)
                .decisionByUser(staffUser)
                .decisionAt(now.minus(Duration.ofDays(1)))
                .build());

        // 2. Cancelled reservation of 8 hours (MUST NOT be counted in booked hours)
        reservationRepository.save(Reservation.builder()
                .equipment(instrumentA)
                .user(studentUser)
                .startTime(now.minus(Duration.ofHours(20)))
                .endTime(now.minus(Duration.ofHours(12)))
                .purpose("Cancelled session")
                .status(ReservationStatus.CANCELLED)
                .cancellationReason("Laser alignment issue")
                .build());

        // 3. Pending reservation
        reservationRepository.save(Reservation.builder()
                .equipment(instrumentA)
                .user(studentUser)
                .startTime(now.plus(Duration.ofHours(24)))
                .endTime(now.plus(Duration.ofHours(28)))
                .purpose("Upcoming session")
                .status(ReservationStatus.PENDING)
                .build());

        // 4. Critical open fault on Instrument B
        faultReportRepository.save(FaultReport.builder()
                .faultNumber("FLT-ANL-001-" + UUID.randomUUID().toString().substring(0, 4))
                .equipment(instrumentB)
                .reportedBy(studentUser)
                .title("Cryocooler compressor failure")
                .description("Overheating warning triggered")
                .severity(FaultSeverity.CRITICAL)
                .status(FaultStatus.OPEN)
                .reportedAt(now.minus(Duration.ofHours(6)))
                .build());

        // 5. Overdue work order
        LocalDate today = now.atZone(ZoneOffset.UTC).toLocalDate();
        workOrderRepository.save(MaintenanceWorkOrder.builder()
                .workOrderNumber("WO-ANL-001-" + UUID.randomUUID().toString().substring(0, 4))
                .equipment(instrumentB)
                .createdBy(staffUser)
                .assignedTechnician(technicianUser)
                .title("Compressor overhaul")
                .description("Replace compressor valves and coolant")
                .priority(WorkOrderPriority.URGENT)
                .status(WorkOrderStatus.IN_PROGRESS)
                .plannedStartDate(today.minusDays(10))
                .plannedCompletionDate(today.minusDays(3)) // 3 days overdue
                .laborHours(BigDecimal.valueOf(8.0))
                .partsCost(BigDecimal.valueOf(450.00))
                .build());

        ReportFilterCriteria filter = new ReportFilterCriteria(windowStart, windowEnd, lab.getId(), null, null);
        DashboardMetricsResponse metrics = analyticsService.getDashboardMetrics(staffUser, filter);

        assertThat(metrics.role()).isEqualTo("STAFF");
        assertThat(metrics.totalActiveEquipment()).isGreaterThanOrEqualTo(2);
        assertThat(metrics.unavailableEquipment()).isGreaterThanOrEqualTo(1);
        assertThat(metrics.pendingReservations()).isGreaterThanOrEqualTo(1);
        assertThat(metrics.criticalFaults()).isGreaterThanOrEqualTo(1);
        assertThat(metrics.overdueWorkOrders()).isGreaterThanOrEqualTo(1);

        // Utilization booked hours includes 4 hours from APPROVED, but strictly excludes the 8 hours from CANCELLED
        assertThat(metrics.totalBookedHours()).isGreaterThanOrEqualTo(4.0);

        // Critical actions queue contains the overdue order and critical fault
        assertThat(metrics.criticalActions()).isNotEmpty();
        assertThat(metrics.criticalActions().stream().anyMatch(a -> a.actionType().equals("CRITICAL_FAULT"))).isTrue();
        assertThat(metrics.criticalActions().stream().anyMatch(a -> a.actionType().equals("OVERDUE_WORK_ORDER"))).isTrue();
    }

    @Test
    @DisplayName("Repeated failures report accurately identifies instruments with >= 2 faults")
    void getRepeatedFailuresReport_detectsInstrumentsWithMultipleFaults() {
        Instant now = Instant.now();
        Instant from = now.minus(Duration.ofDays(30));
        Instant to = now;

        // Add 2 faults for instrument A
        faultReportRepository.save(FaultReport.builder()
                .faultNumber("FLT-REP-001-" + UUID.randomUUID().toString().substring(0, 4))
                .equipment(instrumentA)
                .reportedBy(studentUser)
                .title("Detector drift")
                .description("Calibration baseline shifting")
                .severity(FaultSeverity.MEDIUM)
                .status(FaultStatus.RESOLVED)
                .reportedAt(now.minus(Duration.ofDays(10)))
                .build());

        faultReportRepository.save(FaultReport.builder()
                .faultNumber("FLT-REP-002-" + UUID.randomUUID().toString().substring(0, 4))
                .equipment(instrumentA)
                .reportedBy(studentUser)
                .title("Vacuum seal leakage")
                .description("Pressure rising above operating threshold")
                .severity(FaultSeverity.CRITICAL)
                .status(FaultStatus.OPEN)
                .reportedAt(now.minus(Duration.ofDays(2)))
                .build());

        ReportFilterCriteria filter = new ReportFilterCriteria(from, to, null, null, null);
        List<EquipmentRepeatedFaultsDto> repeated = analyticsService.getRepeatedFailuresReport(filter);

        assertThat(repeated).isNotEmpty();
        EquipmentRepeatedFaultsDto found = repeated.stream()
                .filter(r -> r.equipmentId().equals(instrumentA.getId()))
                .findFirst()
                .orElse(null);

        assertThat(found).isNotNull();
        assertThat(found.faultCount()).isEqualTo(2);
        assertThat(found.criticalCount()).isEqualTo(1);
        assertThat(found.assetTag()).isEqualTo(instrumentA.getAssetTag());
    }

    @Test
    @DisplayName("Overdue work orders report calculates days overdue accurately")
    void getOverdueMaintenanceReport_calculatesDaysOverdue() {
        LocalDate today = LocalDate.now(ZoneOffset.UTC);

        workOrderRepository.save(MaintenanceWorkOrder.builder()
                .workOrderNumber("WO-OVD-001-" + UUID.randomUUID().toString().substring(0, 4))
                .equipment(instrumentA)
                .createdBy(staffUser)
                .assignedTechnician(technicianUser)
                .title("Annual calibration overdue")
                .description("Pending optic alignment")
                .priority(WorkOrderPriority.HIGH)
                .status(WorkOrderStatus.ASSIGNED)
                .plannedStartDate(today.minusDays(15))
                .plannedCompletionDate(today.minusDays(6)) // 6 days overdue
                .build());

        List<OverdueWorkOrderReport> overdueList = analyticsService.getOverdueMaintenanceReport(null);

        assertThat(overdueList).isNotEmpty();
        OverdueWorkOrderReport order = overdueList.stream()
                .filter(o -> o.equipmentAssetTag().equals(instrumentA.getAssetTag()))
                .findFirst()
                .orElse(null);

        assertThat(order).isNotNull();
        assertThat(order.daysOverdue()).isGreaterThanOrEqualTo(6);
    }
}
