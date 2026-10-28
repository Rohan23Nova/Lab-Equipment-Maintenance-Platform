package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.dto.WorkOrderSearchCriteria;
import com.labledger.modules.maintenance.model.MaintenanceWorkOrder;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class MaintenanceWorkOrderSpecifications {

    public static Specification<MaintenanceWorkOrder> withCriteria(WorkOrderSearchCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (criteria.equipmentId() != null) {
                predicates.add(cb.equal(root.get("equipment").get("id"), criteria.equipmentId()));
            }

            if (criteria.assignedTechnicianId() != null) {
                predicates.add(cb.equal(root.get("assignedTechnician").get("id"), criteria.assignedTechnicianId()));
            }

            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }

            if (criteria.priority() != null) {
                predicates.add(cb.equal(root.get("priority"), criteria.priority()));
            }

            if (criteria.passedInspection() != null) {
                predicates.add(cb.equal(root.get("passedInspection"), criteria.passedInspection()));
            }

            if (criteria.search() != null && !criteria.search().isBlank()) {
                String term = "%" + criteria.search().trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate numberMatch = cb.like(cb.lower(root.get("workOrderNumber")), term);
                Predicate equipNameMatch = cb.like(cb.lower(root.get("equipment").get("name")), term);
                Predicate assetTagMatch = cb.like(cb.lower(root.get("equipment").get("assetTag")), term);
                predicates.add(cb.or(titleMatch, numberMatch, equipNameMatch, assetTagMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
