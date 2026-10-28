package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.Laboratory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LaboratoryRepository extends JpaRepository<Laboratory, UUID> {

    Optional<Laboratory> findByCode(String code);

    boolean existsByCode(String code);

    List<Laboratory> findByActiveTrueOrderByBuildingAscNameAsc();

    List<Laboratory> findAllByOrderByBuildingAscNameAsc();
}
