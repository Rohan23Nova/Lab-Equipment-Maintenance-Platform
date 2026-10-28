package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.Equipment;
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
}
