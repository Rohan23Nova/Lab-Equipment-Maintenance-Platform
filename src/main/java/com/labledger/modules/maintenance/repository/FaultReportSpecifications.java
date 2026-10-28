package com.labledger.modules.maintenance.repository;

import com.labledger.modules.maintenance.dto.FaultReportSearchCriteria;
import com.labledger.modules.maintenance.model.FaultReport;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public class FaultReportSpecifications {

    public static Specification<FaultReport> withCriteria(FaultReportSearchCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (criteria.equipmentId() != null) {
                predicates.add(cb.equal(root.get("equipment").get("id"), criteria.equipmentId()));
            }

            if (criteria.reportedById() != null) {
                predicates.add(cb.equal(root.get("reportedBy").get("id"), criteria.reportedById()));
            }

            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }

            if (criteria.severity() != null) {
                predicates.add(cb.equal(root.get("severity"), criteria.severity()));
            }

            if (criteria.search() != null && !criteria.search().isBlank()) {
                String term = "%" + criteria.search().trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), term);
                Predicate numberMatch = cb.like(cb.lower(root.get("faultNumber")), term);
                Predicate equipNameMatch = cb.like(cb.lower(root.get("equipment").get("name")), term);
                Predicate assetTagMatch = cb.like(cb.lower(root.get("equipment").get("assetTag")), term);
                predicates.add(cb.or(titleMatch, numberMatch, equipNameMatch, assetTagMatch));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
