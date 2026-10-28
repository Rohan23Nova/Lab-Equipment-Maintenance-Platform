package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.EquipmentCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EquipmentCategoryRepository extends JpaRepository<EquipmentCategory, UUID> {

    Optional<EquipmentCategory> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    List<EquipmentCategory> findAllByOrderByNameAsc();
}
