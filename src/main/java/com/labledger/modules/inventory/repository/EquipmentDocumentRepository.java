package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.EquipmentDocument;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EquipmentDocumentRepository extends JpaRepository<EquipmentDocument, UUID> {

    @EntityGraph(attributePaths = {"uploadedByUser"})
    List<EquipmentDocument> findByEquipmentIdOrderByCreatedAtDesc(UUID equipmentId);
}
