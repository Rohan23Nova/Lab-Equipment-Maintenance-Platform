package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.model.FaultReport;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
}
