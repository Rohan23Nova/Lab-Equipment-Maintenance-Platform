package com.labledger.modules.inventory.repository;

import com.labledger.modules.inventory.dto.EquipmentSearchCriteria;
import com.labledger.modules.inventory.model.Equipment;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;

public final class EquipmentSpecifications {

    private EquipmentSpecifications() {}

    public static Specification<Equipment> withCriteria(EquipmentSearchCriteria criteria) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (criteria == null) {
                return cb.conjunction();
            }

            if (StringUtils.hasText(criteria.query())) {
                String pattern = "%" + criteria.query().trim().toLowerCase() + "%";
                Predicate nameMatch = cb.like(cb.lower(root.get("name")), pattern);
                Predicate tagMatch = cb.like(cb.lower(root.get("assetTag")), pattern);
                Predicate modelMatch = cb.like(cb.lower(root.get("model")), pattern);
                Predicate mfgMatch = cb.like(cb.lower(root.get("manufacturer")), pattern);
                predicates.add(cb.or(nameMatch, tagMatch, modelMatch, mfgMatch));
            }

            if (criteria.laboratoryId() != null) {
                predicates.add(cb.equal(root.get("laboratory").get("id"), criteria.laboratoryId()));
            }

            if (criteria.categoryId() != null) {
                predicates.add(cb.equal(root.get("category").get("id"), criteria.categoryId()));
            }

            if (criteria.status() != null) {
                predicates.add(cb.equal(root.get("status"), criteria.status()));
            }

            if (criteria.condition() != null) {
                predicates.add(cb.equal(root.get("condition"), criteria.condition()));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
