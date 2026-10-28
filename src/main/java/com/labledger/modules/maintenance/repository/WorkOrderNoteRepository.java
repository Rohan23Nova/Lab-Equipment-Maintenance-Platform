package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.model.WorkOrderNote;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface WorkOrderNoteRepository extends JpaRepository<WorkOrderNote, UUID> {

    @EntityGraph(attributePaths = {"author"})
    List<WorkOrderNote> findByWorkOrderIdOrderByCreatedAtAsc(UUID workOrderId);
}
