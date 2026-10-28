package com.labledger.modules.reservation;

import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ConflictException;
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
import com.labledger.modules.reservation.dto.CancelReservationRequest;
import com.labledger.modules.reservation.dto.CreateReservationRequest;
import com.labledger.modules.reservation.dto.ReservationResponse;
import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.repository.ReservationRepository;
import com.labledger.modules.reservation.service.ReservationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("dev")
class ReservationConcurrencyIntegrationTest {

    @Autowired
    private ReservationService reservationService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private EquipmentRepository equipmentRepository;

    @Autowired
    private EquipmentCategoryRepository categoryRepository;

    @Autowired
    private LaboratoryRepository laboratoryRepository;

    @Autowired
    private UserRepository userRepository;

    private Equipment testEquipment;
    private User testStudent;
    private User testStaff;
    private Authentication studentAuth;
    private Authentication staffAuth;

    @BeforeEach
    void setUp() {
        // Clean up reservations created in tests
        reservationRepository.deleteAll();

        // Ensure category and laboratory exist
        EquipmentCategory category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(EquipmentCategory.builder()
                        .code("TEST_CAT")
                        .name("Test Category")
                        .description("Test description")
                        .build()));

        Laboratory lab = laboratoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> laboratoryRepository.save(Laboratory.builder()
                        .code("TEST_LAB_01")
                        .name("Test Research Lab")
                        .building("Science Center")
                        .roomNumber("101")
                        .active(true)
                        .build()));

        // Create or locate test equipment
        testEquipment = equipmentRepository.findByAssetTag("EQ-CONCURRENCY-TEST")
                .orElseGet(() -> equipmentRepository.save(Equipment.builder()
                        .assetTag("EQ-CONCURRENCY-TEST")
                        .name("High-Speed Centrifuge Test Unit")
                        .category(category)
                        .laboratory(lab)
                        .manufacturer("Eppendorf")
                        .model("5810R")
                        .condition(EquipmentCondition.GOOD)
                        .status(EquipmentStatus.AVAILABLE)
                        .build()));

        // Ensure status is AVAILABLE
        testEquipment.setStatus(EquipmentStatus.AVAILABLE);
        equipmentRepository.save(testEquipment);

        // Create or locate test users
        testStudent = userRepository.findByEmailIgnoreCase("concurrency.student@university.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("concurrency.student@university.edu")
                        .passwordHash("$2a$12$eXampleHashedPasswordForTestEnvironmentOnly000")
                        .firstName("Student")
                        .lastName("Tester")
                        .department("Molecular Biology")
                        .status(UserStatus.ACTIVE)
                        .roles(Set.of(UserRole.ROLE_STUDENT))
                        .build()));

        testStaff = userRepository.findByEmailIgnoreCase("concurrency.staff@university.edu")
                .orElseGet(() -> userRepository.save(User.builder()
                        .email("concurrency.staff@university.edu")
                        .passwordHash("$2a$12$eXampleHashedPasswordForTestEnvironmentOnly000")
                        .firstName("Lab")
                        .lastName("Assistant")
                        .department("Laboratory Operations")
                        .status(UserStatus.ACTIVE)
                        .roles(Set.of(UserRole.ROLE_LAB_ASSISTANT))
                        .build()));

        studentAuth = new UsernamePasswordAuthenticationToken(
                testStudent.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_STUDENT"))
        );

        staffAuth = new UsernamePasswordAuthenticationToken(
                testStaff.getEmail(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_LAB_ASSISTANT"))
        );
    }

    @Test
    @DisplayName("Half-Open Interval: Adjacent reservations [10:00, 11:00) and [11:00, 12:00) are both allowed")
    void adjacentReservations_whenOneEndsAsNextBegins_areBothAllowed() {
        Instant baseTime = Instant.now().plus(2, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant slot1Start = baseTime;
        Instant slot1End = baseTime.plus(1, ChronoUnit.HOURS);

        Instant slot2Start = slot1End; // exactly matches slot 1 end time
        Instant slot2End = slot2Start.plus(1, ChronoUnit.HOURS);

        CreateReservationRequest req1 = new CreateReservationRequest(
                testEquipment.getId(), slot1Start, slot1End, "First session"
        );
        CreateReservationRequest req2 = new CreateReservationRequest(
                testEquipment.getId(), slot2Start, slot2End, "Second adjacent session"
        );

        ReservationResponse res1 = reservationService.createReservation(req1, studentAuth);
        ReservationResponse res2 = reservationService.createReservation(req2, studentAuth);

        assertThat(res1).isNotNull();
        assertThat(res2).isNotNull();
        assertThat(res1.status()).isEqualTo(ReservationStatus.PENDING);
        assertThat(res2.status()).isEqualTo(ReservationStatus.PENDING);

        List<Reservation> all = reservationRepository.findAll();
        assertThat(all).hasSize(2);
    }

    @Test
    @DisplayName("Overlapping Reservations: Attempting to reserve an intersecting slot throws ConflictException")
    void overlappingReservations_areRejectedWithConflict() {
        Instant baseTime = Instant.now().plus(3, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant slot1Start = baseTime;
        Instant slot1End = baseTime.plus(2, ChronoUnit.HOURS); // [10:00, 12:00)

        // Slot 2 overlaps: [11:00, 13:00)
        Instant slot2Start = baseTime.plus(1, ChronoUnit.HOURS);
        Instant slot2End = slot2Start.plus(2, ChronoUnit.HOURS);

        CreateReservationRequest req1 = new CreateReservationRequest(
                testEquipment.getId(), slot1Start, slot1End, "Original session"
        );
        CreateReservationRequest req2 = new CreateReservationRequest(
                testEquipment.getId(), slot2Start, slot2End, "Conflicting overlapping session"
        );

        reservationService.createReservation(req1, studentAuth);

        assertThatThrownBy(() -> reservationService.createReservation(req2, studentAuth))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("overlaps with an existing reservation");
    }

    @Test
    @DisplayName("Cancelled Reservations: A cancelled slot does not block new bookings for that time window")
    void cancelledOrRejectedReservations_doNotBlockAvailability() {
        Instant baseTime = Instant.now().plus(4, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant start = baseTime;
        Instant end = baseTime.plus(2, ChronoUnit.HOURS);

        CreateReservationRequest req1 = new CreateReservationRequest(
                testEquipment.getId(), start, end, "Session to be cancelled"
        );

        ReservationResponse res1 = reservationService.createReservation(req1, studentAuth);
        reservationService.cancelReservation(res1.id(), new CancelReservationRequest("Testing cancellation"), studentAuth);

        // Attempt new booking for the same slot
        CreateReservationRequest req2 = new CreateReservationRequest(
                testEquipment.getId(), start, end, "Replacement booking"
        );

        ReservationResponse res2 = reservationService.createReservation(req2, studentAuth);
        assertThat(res2).isNotNull();
        assertThat(res2.status()).isEqualTo(ReservationStatus.PENDING);
    }

    @Test
    @DisplayName("Equipment Status Invariant: Equipment under maintenance cannot be booked")
    void equipmentUnderMaintenance_cannotBeReserved() {
        testEquipment.setStatus(EquipmentStatus.UNDER_MAINTENANCE);
        equipmentRepository.save(testEquipment);

        Instant start = Instant.now().plus(5, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(1, ChronoUnit.HOURS);

        CreateReservationRequest req = new CreateReservationRequest(
                testEquipment.getId(), start, end, "Experiment during maintenance"
        );

        assertThatThrownBy(() -> reservationService.createReservation(req, studentAuth))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("currently under maintenance and unavailable for booking");
    }

    @Test
    @DisplayName("Self-Approval Invariant: Staff members cannot approve their own reservation requests")
    void selfApproval_attemptByStaff_isRejectedWithBusinessRuleException() {
        Instant start = Instant.now().plus(6, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        CreateReservationRequest req = new CreateReservationRequest(
                testEquipment.getId(), start, end, "Staff research booking"
        );

        ReservationResponse staffRes = reservationService.createReservation(req, staffAuth);

        assertThatThrownBy(() -> reservationService.approveReservation(staffRes.id(), staffAuth))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Staff members are not permitted to approve their own reservation requests");
    }

    @Test
    @DisplayName("Database Concurrency & Race Condition: Concurrent requests for overlapping slots result in at most one success")
    void concurrentOverlappingRequests_resultInAtMostOneSuccess() throws Exception {
        Instant start = Instant.now().plus(7, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch readyLatch = new CountDownLatch(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            final int index = i;
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await(); // Ensure both threads execute simultaneously
                    CreateReservationRequest req = new CreateReservationRequest(
                            testEquipment.getId(),
                            start,
                            end,
                            "Concurrent booking attempt #" + index
                    );
                    reservationService.createReservation(req, studentAuth);
                    successCount.incrementAndGet();
                } catch (Exception ex) {
                    failureCount.incrementAndGet();
                }
            });
        }

        readyLatch.await(5, TimeUnit.SECONDS);
        startLatch.countDown(); // Trigger concurrent execution
        executor.shutdown();
        boolean finished = executor.awaitTermination(10, TimeUnit.SECONDS);

        assertThat(finished).isTrue();
        assertThat(successCount.get()).isEqualTo(1);
        assertThat(failureCount.get()).isEqualTo(1);

        // Verify database contains exactly 1 reservation for this slot
        List<Reservation> active = reservationRepository.findAll();
        assertThat(active).hasSize(1);
        assertThat(active.get(0).getStartTime()).isEqualTo(start);
        assertThat(active.get(0).getEndTime()).isEqualTo(end);
    }
}
