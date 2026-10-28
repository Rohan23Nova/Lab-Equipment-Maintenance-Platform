package com.labledger.modules.reservation.repository;

import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReservationRepository extends JpaRepository<Reservation, UUID>, JpaSpecificationExecutor<Reservation> {

    @Override
    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "user", "decisionByUser"})
    Optional<Reservation> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "user", "decisionByUser"})
    Page<Reservation> findAll(Specification<Reservation> spec, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "user", "decisionByUser"})
    Page<Reservation> findByUserIdOrderByStartTimeDesc(UUID userId, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "user", "decisionByUser"})
    Page<Reservation> findByUserIdAndStatusOrderByStartTimeDesc(UUID userId, ReservationStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "user", "decisionByUser"})
    Page<Reservation> findByStatusOrderByCreatedAtAsc(ReservationStatus status, Pageable pageable);

    /**
     * Checks if any active reservation overlaps with the requested interval [startTime, endTime)
     * using strict half-open interval overlap: (startTime < existingEnd) AND (endTime > existingStart).
     */
    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
           "WHERE r.equipment.id = :equipmentId " +
           "AND r.status IN :statuses " +
           "AND r.startTime < :endTime AND r.endTime > :startTime")
    boolean hasOverlappingReservations(
            @Param("equipmentId") UUID equipmentId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("statuses") Collection<ReservationStatus> statuses
    );

    /**
     * Checks for overlaps excluding a specific reservation ID (used during approval or updates).
     */
    @Query("SELECT COUNT(r) > 0 FROM Reservation r " +
           "WHERE r.equipment.id = :equipmentId " +
           "AND r.id != :excludeReservationId " +
           "AND r.status IN :statuses " +
           "AND r.startTime < :endTime AND r.endTime > :startTime")
    boolean hasOverlappingReservationsExcluding(
            @Param("equipmentId") UUID equipmentId,
            @Param("excludeReservationId") UUID excludeReservationId,
            @Param("startTime") Instant startTime,
            @Param("endTime") Instant endTime,
            @Param("statuses") Collection<ReservationStatus> statuses
    );

    /**
     * Retrieves all active reservations in the given time window for calendar visualization.
     */
    @Query("SELECT r FROM Reservation r " +
           "JOIN FETCH r.user " +
           "WHERE r.equipment.id = :equipmentId " +
           "AND r.status IN :statuses " +
           "AND r.startTime < :rangeEnd AND r.endTime > :rangeStart " +
           "ORDER BY r.startTime ASC")
    List<Reservation> findActiveSlotsForEquipment(
            @Param("equipmentId") UUID equipmentId,
            @Param("rangeStart") Instant rangeStart,
            @Param("rangeEnd") Instant rangeEnd,
            @Param("statuses") Collection<ReservationStatus> statuses
    );
}
