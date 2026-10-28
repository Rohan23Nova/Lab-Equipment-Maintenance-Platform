package com.labledger.modules.analytics.dto;

import java.time.Instant;
import java.util.UUID;

public record ReportFilterCriteria(
        Instant fromTimestamp,
        Instant toTimestamp,
        UUID laboratoryId,
        UUID categoryId,
        String status
) {
    public Instant resolvedFrom() {
        return fromTimestamp != null ? fromTimestamp : Instant.now().minusSeconds(30L * 24 * 3600);
    }

    public Instant resolvedTo() {
        return toTimestamp != null ? toTimestamp : Instant.now();
    }
}
