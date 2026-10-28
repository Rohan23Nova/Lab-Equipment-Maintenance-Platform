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
}
