package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.model.FaultReport;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FaultReportRepository extends JpaRepository<FaultReport, UUID>, JpaSpecificationExecutor<FaultReport> {

    Optional<FaultReport> findByFaultNumber(String faultNumber);

    @Override
    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "reportedBy", "triagedBy", "resolvedBy", "closedBy"})
    Page<FaultReport> findAll(Specification<FaultReport> spec, Pageable pageable);

    @Query("SELECT f FROM FaultReport f " +
           "LEFT JOIN FETCH f.equipment e " +
           "LEFT JOIN FETCH e.laboratory " +
           "LEFT JOIN FETCH f.reportedBy " +
           "LEFT JOIN FETCH f.triagedBy " +
           "LEFT JOIN FETCH f.resolvedBy " +
           "LEFT JOIN FETCH f.closedBy " +
           "WHERE f.id = :id")
    Optional<FaultReport> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"equipment", "reportedBy"})
    List<FaultReport> findByEquipmentIdOrderByReportedAtDesc(UUID equipmentId);

    @Query("SELECT COUNT(f) FROM FaultReport f")
    long countTotalReports();

    long countByStatusIn(Collection<FaultStatus> statuses);

    long countByStatusInAndSeverity(Collection<FaultStatus> statuses, FaultSeverity severity);

    long countByReportedByIdAndStatusIn(UUID reportedById, Collection<FaultStatus> statuses);

    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory"})
    List<FaultReport> findTop5ByStatusInAndSeverityOrderByReportedAtDesc(
            Collection<FaultStatus> statuses,
            FaultSeverity severity
    );

    @Query("SELECT f.equipment.id, f.equipment.assetTag, f.equipment.name, " +
           "f.equipment.laboratory.name, f.equipment.status, " +
           "COUNT(f), " +
           "SUM(CASE WHEN f.severity = 'CRITICAL' THEN 1L ELSE 0L END), " +
           "MAX(f.reportedAt) " +
           "FROM FaultReport f " +
           "WHERE f.reportedAt >= :fromTime AND f.reportedAt <= :toTime " +
           "GROUP BY f.equipment.id, f.equipment.assetTag, f.equipment.name, " +
           "f.equipment.laboratory.name, f.equipment.status " +
           "HAVING COUNT(f) >= 2 " +
           "ORDER BY COUNT(f) DESC, MAX(f.reportedAt) DESC")
    List<Object[]> findEquipmentWithRepeatedFaults(
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );

    @Query("SELECT f FROM FaultReport f " +
           "WHERE f.reportedAt >= :fromTime AND f.reportedAt <= :toTime " +
           "ORDER BY f.reportedAt ASC")
    List<FaultReport> findFaultsBetween(
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );
}
