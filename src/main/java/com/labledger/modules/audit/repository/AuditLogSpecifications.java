package com.labledger.modules.audit.repository;

import com.labledger.modules.audit.dto.AuditLogSearchCriteria;
import com.labledger.modules.audit.model.AuditLog;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.util.ArrayList;
import java.util.List;

public final class AuditLogSpecifications {

    private AuditLogSpecifications() {}

    public static Specification<AuditLog> withCriteria(AuditLogSearchCriteria criteria) {
        return (root, query, cb) -> {
            if (criteria == null) {
                return cb.conjunction();
            }

            List<Predicate> predicates = new ArrayList<>();

            if (criteria.entityType() != null) {
                predicates.add(cb.equal(root.get("entityType"), criteria.entityType()));
            }

            if (criteria.action() != null) {
                predicates.add(cb.equal(root.get("action"), criteria.action()));
            }

            if (criteria.actorId() != null) {
                predicates.add(cb.equal(root.get("actorId"), criteria.actorId()));
            }

            if (criteria.fromTimestamp() != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), criteria.fromTimestamp()));
            }

            if (criteria.toTimestamp() != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), criteria.toTimestamp()));
            }

            if (criteria.search() != null && !criteria.search().isBlank()) {
                String pattern = "%" + criteria.search().trim().toLowerCase() + "%";
                Predicate searchPredicate = cb.or(
                        cb.like(cb.lower(root.get("summary")), pattern),
                        cb.like(cb.lower(root.get("entityIdentifier")), pattern),
                        cb.like(cb.lower(root.get("actorName")), pattern),
                        cb.like(cb.lower(root.get("actorEmail")), pattern)
                );
                predicates.add(searchPredicate);
            }

            query.orderBy(cb.desc(root.get("createdAt")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
