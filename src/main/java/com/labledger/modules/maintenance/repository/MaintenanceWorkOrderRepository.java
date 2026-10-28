package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.model.MaintenanceWorkOrder;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceWorkOrderRepository
        extends JpaRepository<MaintenanceWorkOrder, UUID>, JpaSpecificationExecutor<MaintenanceWorkOrder> {

    Optional<MaintenanceWorkOrder> findByWorkOrderNumber(String workOrderNumber);

    @Override
    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "faultReport", "assignedTechnician", "createdBy", "inspectedBy"})
    Page<MaintenanceWorkOrder> findAll(Specification<MaintenanceWorkOrder> spec, Pageable pageable);

    @Query("SELECT w FROM MaintenanceWorkOrder w " +
           "LEFT JOIN FETCH w.equipment e " +
           "LEFT JOIN FETCH e.laboratory " +
           "LEFT JOIN FETCH w.faultReport " +
           "LEFT JOIN FETCH w.assignedTechnician " +
           "LEFT JOIN FETCH w.createdBy " +
           "LEFT JOIN FETCH w.inspectedBy " +
           "WHERE w.id = :id")
    Optional<MaintenanceWorkOrder> findByIdWithDetails(@Param("id") UUID id);

    @EntityGraph(attributePaths = {"equipment", "assignedTechnician"})
    List<MaintenanceWorkOrder> findByEquipmentIdOrderByCreatedAtDesc(UUID equipmentId);

    @EntityGraph(attributePaths = {"equipment", "faultReport"})
    Page<MaintenanceWorkOrder> findByAssignedTechnicianIdAndStatusIn(
            UUID technicianId,
            Collection<WorkOrderStatus> statuses,
            Pageable pageable
    );

    @Query("SELECT COUNT(w) FROM MaintenanceWorkOrder w")
    long countTotalWorkOrders();

    long countByStatusIn(Collection<WorkOrderStatus> statuses);

    long countByAssignedTechnicianIdAndStatusIn(UUID technicianId, Collection<WorkOrderStatus> statuses);

    @Query("SELECT COUNT(w) FROM MaintenanceWorkOrder w " +
           "WHERE w.status != 'COMPLETED' " +
           "AND w.plannedCompletionDate < :now")
    long countOverdueWorkOrders(@Param("now") LocalDate now);

    @Query("SELECT COUNT(w) FROM MaintenanceWorkOrder w " +
           "WHERE w.assignedTechnician.id = :technicianId " +
           "AND w.status != 'COMPLETED' " +
           "AND w.plannedCompletionDate < :now")
    long countOverdueWorkOrdersForTechnician(
            @Param("technicianId") UUID technicianId,
            @Param("now") LocalDate now
    );

    @EntityGraph(attributePaths = {"equipment", "equipment.laboratory", "assignedTechnician"})
    @Query("SELECT w FROM MaintenanceWorkOrder w " +
           "WHERE w.status != 'COMPLETED' " +
           "AND w.plannedCompletionDate < :now " +
           "ORDER BY w.plannedCompletionDate ASC")
    List<MaintenanceWorkOrder> findOverdueWorkOrders(@Param("now") LocalDate now);

    @EntityGraph(attributePaths = {"equipment", "assignedTechnician"})
    @Query("SELECT w FROM MaintenanceWorkOrder w " +
           "WHERE w.status = 'COMPLETED' " +
           "AND w.actualCompletionTime >= :fromTime AND w.actualCompletionTime <= :toTime " +
           "ORDER BY w.actualCompletionTime ASC")
    List<MaintenanceWorkOrder> findCompletedWorkOrdersBetween(
            @Param("fromTime") Instant fromTime,
            @Param("toTime") Instant toTime
    );
}
