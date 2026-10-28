package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.Equipment;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EquipmentRepository extends JpaRepository<Equipment, UUID>, JpaSpecificationExecutor<Equipment> {

    Optional<Equipment> findByAssetTag(String assetTag);

    boolean existsByAssetTag(String assetTag);

    @Override
    @EntityGraph(attributePaths = {"laboratory", "category"})
    Page<Equipment> findAll(Specification<Equipment> spec, Pageable pageable);

    @Query("SELECT e FROM Equipment e JOIN FETCH e.laboratory JOIN FETCH e.category WHERE e.id = :id")
    Optional<Equipment> findByIdWithDetails(@Param("id") UUID id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Equipment e WHERE e.id = :id")
    Optional<Equipment> findByIdWithLock(@Param("id") UUID id);

    long countByStatusNot(EquipmentStatus status);

    long countByStatus(EquipmentStatus status);

    long countByLaboratoryIdAndStatusNot(UUID laboratoryId, EquipmentStatus status);

    long countByLaboratoryIdAndStatus(UUID laboratoryId, EquipmentStatus status);

    List<Equipment> findByStatusNot(EquipmentStatus status);

    List<Equipment> findByLaboratoryIdAndStatusNot(UUID laboratoryId, EquipmentStatus status);

    @Query("SELECT e.category.name, COUNT(e) FROM Equipment e WHERE e.status != :excludeStatus GROUP BY e.category.name")
    List<Object[]> countGroupedByCategory(@Param("excludeStatus") EquipmentStatus excludeStatus);

    @Query("SELECT e.status, COUNT(e) FROM Equipment e GROUP BY e.status")
    List<Object[]> countGroupedByStatus();

    @Query("SELECT e.condition, COUNT(e) FROM Equipment e WHERE e.status != :excludeStatus GROUP BY e.condition")
    List<Object[]> countGroupedByCondition(@Param("excludeStatus") EquipmentStatus excludeStatus);

    @Query("SELECT e.laboratory.name, COUNT(e) FROM Equipment e WHERE e.status != :excludeStatus GROUP BY e.laboratory.name")
    List<Object[]> countGroupedByLaboratory(@Param("excludeStatus") EquipmentStatus excludeStatus);

    @Query("SELECT COALESCE(SUM(e.purchaseCost), 0) FROM Equipment e WHERE e.status != :excludeStatus")
    BigDecimal sumPurchaseCostByStatusNot(@Param("excludeStatus") EquipmentStatus excludeStatus);
}
