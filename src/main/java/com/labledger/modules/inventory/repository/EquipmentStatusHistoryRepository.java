package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.EquipmentStatusHistory;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EquipmentStatusHistoryRepository extends JpaRepository<EquipmentStatusHistory, UUID> {

    @EntityGraph(attributePaths = {"changedByUser"})
    List<EquipmentStatusHistory> findByEquipmentIdOrderByCreatedAtDesc(UUID equipmentId);
}
