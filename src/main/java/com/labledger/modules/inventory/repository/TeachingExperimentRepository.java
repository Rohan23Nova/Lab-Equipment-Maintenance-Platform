package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.model.TeachingExperiment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TeachingExperimentRepository extends JpaRepository<TeachingExperiment, UUID> {

    Optional<TeachingExperiment> findByCode(String code);

    List<TeachingExperiment> findByLaboratoryIdOrderByCodeAsc(UUID laboratoryId);

    List<TeachingExperiment> findBySubjectOrderByCodeAsc(String subject);

    List<TeachingExperiment> findAllByOrderBySubjectAscCodeAsc();

    @Query("SELECT e FROM TeachingExperiment e JOIN e.requiredEquipment eq WHERE eq.id = :equipmentId ORDER BY e.code ASC")
    List<TeachingExperiment> findByEquipmentId(@Param("equipmentId") UUID equipmentId);

    long countByLaboratoryId(UUID laboratoryId);
}
