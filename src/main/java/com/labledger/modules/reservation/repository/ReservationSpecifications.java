package com.labledger.modules.reservation.repository;

import com.labledger.modules.reservation.model.Reservation;
import com.labledger.modules.reservation.model.ReservationStatus;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.UUID;

public final class ReservationSpecifications {

    private ReservationSpecifications() {}

    public static Specification<Reservation> forUser(UUID userId) {
        return (root, query, cb) ->
                userId == null ? cb.conjunction() : cb.equal(root.get("user").get("id"), userId);
    }

    public static Specification<Reservation> forEquipment(UUID equipmentId) {
        return (root, query, cb) ->
                equipmentId == null ? cb.conjunction() : cb.equal(root.get("equipment").get("id"), equipmentId);
    }

    public static Specification<Reservation> withStatus(ReservationStatus status) {
        return (root, query, cb) ->
                status == null ? cb.conjunction() : cb.equal(root.get("status"), status);
    }

    public static Specification<Reservation> withinInterval(Instant fromTime, Instant toTime) {
        return (root, query, cb) -> {
            if (fromTime == null && toTime == null) {
                return cb.conjunction();
            }
            if (fromTime != null && toTime != null) {
                // Overlaps with [fromTime, toTime)
                return cb.and(
                        cb.lessThan(root.get("startTime"), toTime),
                        cb.greaterThan(root.get("endTime"), fromTime)
                );
            }
            if (fromTime != null) {
                return cb.greaterThanOrEqualTo(root.get("endTime"), fromTime);
            }
            return cb.lessThanOrEqualTo(root.get("startTime"), toTime);
        };
    }
}
