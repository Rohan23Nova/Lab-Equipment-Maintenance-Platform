package com.labledger.modules.maintenance;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import com.labledger.modules.inventory.model.*;
import com.labledger.modules.inventory.repository.EquipmentCategoryRepository;
import com.labledger.modules.inventory.repository.EquipmentRepository;
import com.labledger.modules.inventory.repository.LaboratoryRepository;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
import com.labledger.modules.maintenance.service.MaintenanceService;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
@Transactional
class MaintenanceIntegrationTest {

    @Autowired
    private MaintenanceService maintenanceService;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private EquipmentCategoryRepository categoryRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ReservationRepository reservationRepository;

    private User studentUser;
    private User assistantUser;
    private User technicianUser;
    private Equipment testEquipment;
    private Authentication studentAuth;
    private Authentication assistantAuth;
    private Authentication technicianAuth;

    @BeforeEach
    void setUp() {
        // Create test users
        studentUser = userRepository.save(User.builder()
                .email("maint.student." + UUID.randomUUID() + "@university.edu")
                .passwordHash("$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2")
                .firstName("Test")
                .lastName("Student")
                .department("Bioengineering")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .build());

        assistantUser = userRepository.save(User.builder()
                .email("maint.assistant." + UUID.randomUUID() + "@university.edu")
                .passwordHash("$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2")
                .firstName("Test")
                .lastName("Assistant")
                .department("Bioengineering")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_LAB_ASSISTANT))
                .build());

        technicianUser = userRepository.save(User.builder()
                .email("maint.technician." + UUID.randomUUID() + "@university.edu")
                .passwordHash("$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2")
                .firstName("Test")
                .lastName("Technician")
                .department("Instrumentation Engineering")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_TECHNICIAN))
                .build());

        studentAuth = new UsernamePasswordAuthenticationToken(
                studentUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_STUDENT")));
        assistantAuth = new UsernamePasswordAuthenticationToken(
                assistantUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_LAB_ASSISTANT")));
        technicianAuth = new UsernamePasswordAuthenticationToken(
                technicianUser.getEmail(), null, List.of(new SimpleGrantedAuthority("ROLE_TECHNICIAN")));

        // Create laboratory and category
        Laboratory lab = laboratoryRepository.save(Laboratory.builder()
                .code("LAB-TEST-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase())
                .name("Integration Test Bay")
                .building("Science Center")
                .roomNumber("Room 400")
                .active(true)
                .build());

        EquipmentCategory category = categoryRepository.save(EquipmentCategory.builder()
                .code("CAT-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase())
                .name("Test Analytical Analyzers")
                .build());

        testEquipment = equipmentRepository.save(Equipment.builder()
                .assetTag("EQ-TEST-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase())
                .name("Beckman High-Speed Centrifuge")
                .category(category)
                .laboratory(lab)
                .manufacturer("Beckman")
                .model("Avanti JXN")
                .condition(EquipmentCondition.GOOD)
                .status(EquipmentStatus.AVAILABLE)
                .build());
    }

    @Test
    @DisplayName("Critical fault report immediately triggers equipment lockdown and cancels upcoming reservations")
    void criticalFault_locksDownEquipmentAndCancelsReservations() {
        // Seed an upcoming approved reservation
        Reservation futureBooking = reservationRepository.save(Reservation.builder()
                .equipment(testEquipment)
                .user(studentUser)
                .startTime(Instant.now().plusSeconds(7200))
                .endTime(Instant.now().plusSeconds(14400))
                .purpose("Cell fractionation sample spin")
                .status(ReservationStatus.APPROVED)
                .build());

        CreateFaultReportRequest request = new CreateFaultReportRequest(
                testEquipment.getId(),
                "Rotor drive imbalance catastrophic vibration",
                "Spindle bearing threw high temperature alarm during 25,000 RPM run.",
                FaultSeverity.CRITICAL
        );

        FaultReportResponse report = maintenanceService.reportFault(request, studentAuth);

        // Verify Fault Report
        assertThat(report.severity()).isEqualTo(FaultSeverity.CRITICAL);
        assertThat(report.status()).isEqualTo(FaultStatus.OPEN);

        // Verify Equipment is now UNDER_MAINTENANCE
        Equipment updatedEquip = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(updatedEquip.getStatus()).isEqualTo(EquipmentStatus.UNDER_MAINTENANCE);

        // Verify future booking was cancelled with explicit reason
        Reservation cancelledBooking = reservationRepository.findById(futureBooking.getId()).orElseThrow();
        assertThat(cancelledBooking.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(cancelledBooking.getCancellationReason()).contains("Cancelled due to critical instrument fault report");
    }

    @Test
    @DisplayName("Low severity fault logs issue without restricting equipment availability")
    void lowSeverityFault_doesNotLockDownEquipment() {
        CreateFaultReportRequest request = new CreateFaultReportRequest(
                testEquipment.getId(),
                "Power switch LED flickering",
                "Green power indicator light flickers periodically, but operation is nominal.",
                FaultSeverity.LOW
        );

        FaultReportResponse report = maintenanceService.reportFault(request, studentAuth);

        assertThat(report.severity()).isEqualTo(FaultSeverity.LOW);
        Equipment updatedEquip = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(updatedEquip.getStatus()).isEqualTo(EquipmentStatus.AVAILABLE);
    }

    @Test
    @DisplayName("Triage decision with placeUnderMaintenance=true locks down equipment and frees slots")
    void triage_placesEquipmentUnderMaintenance() {
        Reservation futureBooking = reservationRepository.save(Reservation.builder()
                .equipment(testEquipment)
                .user(studentUser)
                .startTime(Instant.now().plusSeconds(10000))
                .endTime(Instant.now().plusSeconds(18000))
                .purpose("Spin test")
                .status(ReservationStatus.APPROVED)
                .build());

        // Report normal fault
        FaultReportResponse report = maintenanceService.reportFault(new CreateFaultReportRequest(
                testEquipment.getId(), "Vacuum seal leak", "Takes 10 minutes to draw vacuum", FaultSeverity.MEDIUM
        ), studentAuth);

        // Triage and place under maintenance
        FaultReportResponse triaged = maintenanceService.triageFault(
                report.id(),
                new TriageFaultReportRequest(FaultStatus.TRIAGED, "Verified O-ring vacuum degradation.", true),
                assistantAuth
        );

        assertThat(triaged.status()).isEqualTo(FaultStatus.TRIAGED);
        Equipment updatedEquip = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(updatedEquip.getStatus()).isEqualTo(EquipmentStatus.UNDER_MAINTENANCE);

        Reservation cancelledBooking = reservationRepository.findById(futureBooking.getId()).orElseThrow();
        assertThat(cancelledBooking.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
    }

    @Test
    @DisplayName("End-to-end work order lifecycle: Work completion retains equipment in maintenance until Return-to-Service inspection passes")
    void workOrderLifecycle_andReturnToServiceInspection() {
        // 1. Report fault
        FaultReportResponse fault = maintenanceService.reportFault(new CreateFaultReportRequest(
                testEquipment.getId(), "Optical sensor glitch", "Sensor drift", FaultSeverity.HIGH
        ), studentAuth);

        // 2. Issue Work Order
        CreateWorkOrderRequest woReq = new CreateWorkOrderRequest(
                fault.id(),
                testEquipment.getId(),
                technicianUser.getId(),
                "Replace Centrifuge Speed Optical Sensor",
                "Calibrate tachometer optical sensor pick-up.",
                WorkOrderPriority.HIGH,
                LocalDate.now(),
                LocalDate.now().plusDays(2)
        );
        MaintenanceWorkOrderResponse wo = maintenanceService.createWorkOrder(woReq, assistantAuth);
        assertThat(wo.status()).isEqualTo(WorkOrderStatus.ASSIGNED);

        // Verify fault advanced to IN_REPAIR
        assertThat(maintenanceService.getFaultById(fault.id()).status()).isEqualTo(FaultStatus.IN_REPAIR);

        // 3. Technician starts work
        MaintenanceWorkOrderResponse startedWo = maintenanceService.startWorkOrder(wo.id(), technicianAuth);
        assertThat(startedWo.status()).isEqualTo(WorkOrderStatus.IN_PROGRESS);
        assertThat(startedWo.actualStartTime()).isNotNull();

        // 4. Technician logs progress and blocker
        maintenanceService.updateWorkOrderProgress(
                wo.id(),
                new UpdateWorkOrderProgressRequest(
                        WorkOrderStatus.BLOCKED,
                        "Awaiting specialized spanner tool from instrument depot",
                        new BigDecimal("1.50"),
                        BigDecimal.ZERO,
                        null,
                        "Paused work pending tool arrival."
                ),
                technicianAuth
        );

        MaintenanceWorkOrderResponse blockedWo = maintenanceService.getWorkOrderById(wo.id());
        assertThat(blockedWo.status()).isEqualTo(WorkOrderStatus.BLOCKED);
        assertThat(blockedWo.blockedReason()).contains("Awaiting specialized spanner tool");

        // 5. Technician unblocks and resumes work
        maintenanceService.updateWorkOrderProgress(
                wo.id(),
                new UpdateWorkOrderProgressRequest(
                        WorkOrderStatus.IN_PROGRESS,
                        null,
                        new BigDecimal("2.50"),
                        new BigDecimal("85.00"),
                        null,
                        "Tool arrived. Sensor installed and aligned."
                ),
                technicianAuth
        );

        // 6. Technician completes work
        MaintenanceWorkOrderResponse completedWo = maintenanceService.completeWorkOrder(
                wo.id(),
                new CompleteWorkOrderRequest(
                        "Installed new optical speed sensor (Part #OP-992). Verified tachometer reading at 10,000 RPM.",
                        new BigDecimal("4.00"),
                        new BigDecimal("85.00")
                ),
                technicianAuth
        );

        assertThat(completedWo.status()).isEqualTo(WorkOrderStatus.COMPLETED);
        // Verify fault report advanced to RESOLVED
        assertThat(maintenanceService.getFaultById(fault.id()).status()).isEqualTo(FaultStatus.RESOLVED);

        // CRITICAL INVARIANT: Equipment must STILL be UNDER_MAINTENANCE!
        Equipment equipAfterComplete = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(equipAfterComplete.getStatus()).isEqualTo(EquipmentStatus.UNDER_MAINTENANCE);

        // 7. Return to service: inspection passed by authorized staff
        MaintenanceWorkOrderResponse returnedWo = maintenanceService.returnToService(
                wo.id(),
                new ReturnToServiceRequest(
                        true,
                        "Witnessed 15-minute diagnostic run at max rated speed. Vibration baseline is excellent.",
                        true
                ),
                assistantAuth
        );

        assertThat(returnedWo.passedInspection()).isTrue();

        // Verify equipment is restored to AVAILABLE
        Equipment equipAfterInspection = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(equipAfterInspection.getStatus()).isEqualTo(EquipmentStatus.AVAILABLE);

        // Verify fault report is now CLOSED
        assertThat(maintenanceService.getFaultById(fault.id()).status()).isEqualTo(FaultStatus.CLOSED);
    }

    @Test
    @DisplayName("Failed inspection keeps equipment UNDER_MAINTENANCE and reopens work order")
    void failedInspection_retainsUnderMaintenance() {
        CreateWorkOrderRequest woReq = new CreateWorkOrderRequest(
                null, testEquipment.getId(), technicianUser.getId(),
                "Annual bearing grease", "Bearing grease service", WorkOrderPriority.MEDIUM,
                LocalDate.now(), LocalDate.now().plusDays(1)
        );
        MaintenanceWorkOrderResponse wo = maintenanceService.createWorkOrder(woReq, assistantAuth);
        maintenanceService.startWorkOrder(wo.id(), technicianAuth);
        maintenanceService.completeWorkOrder(
                wo.id(),
                new CompleteWorkOrderRequest("Greased bearings.", new BigDecimal("1.00"), BigDecimal.ZERO),
                technicianAuth
        );

        // Staff rejects inspection
        MaintenanceWorkOrderResponse rejectedWo = maintenanceService.returnToService(
                wo.id(),
                new ReturnToServiceRequest(false, "Unusual grinding acoustic profile detected on spin-down.", false),
                assistantAuth
        );

        assertThat(rejectedWo.passedInspection()).isFalse();
        assertThat(rejectedWo.status()).isEqualTo(WorkOrderStatus.IN_PROGRESS);

        Equipment equip = equipmentRepository.findById(testEquipment.getId()).orElseThrow();
        assertThat(equip.getStatus()).isEqualTo(EquipmentStatus.UNDER_MAINTENANCE);
    }

    @Test
    @DisplayName("Invalid state transitions are rejected with BusinessRuleException")
    void invalidTransitions_throwBusinessRuleException() {
        CreateWorkOrderRequest woReq = new CreateWorkOrderRequest(
                null, testEquipment.getId(), technicianUser.getId(),
                "Alignment", "Alignment", WorkOrderPriority.LOW,
                LocalDate.now(), LocalDate.now().plusDays(1)
        );
        MaintenanceWorkOrderResponse wo = maintenanceService.createWorkOrder(woReq, assistantAuth);

        // Cannot return to service if work order is not COMPLETED
        assertThatThrownBy(() -> maintenanceService.returnToService(
                wo.id(),
                new ReturnToServiceRequest(true, "Looks good", true),
                assistantAuth
        )).isInstanceOf(BusinessRuleException.class)
          .hasMessageContaining("Return-to-service inspection requires the work order to be in 'COMPLETED' state first");

        // Cannot triage a closed fault report
        FaultReportResponse fault = maintenanceService.reportFault(
                new CreateFaultReportRequest(testEquipment.getId(), "Title", "Desc", FaultSeverity.LOW),
                studentAuth
        );
        maintenanceService.resolveFault(fault.id(), new ResolveFaultReportRequest("Fixed"), assistantAuth);
        maintenanceService.closeFault(fault.id(), assistantAuth);

        assertThatThrownBy(() -> maintenanceService.triageFault(
                fault.id(),
                new TriageFaultReportRequest(FaultStatus.TRIAGED, "Notes", false),
                assistantAuth
        )).isInstanceOf(BusinessRuleException.class)
          .hasMessageContaining("Cannot triage a fault report that is already in 'CLOSED' state");
    }
}
