package com.labledger.modules.analytics.dto;

import java.time.Instant;

public record CriticalActionItem(
        String id,
        String actionType,
        String severity,
        String title,
        String description,
        String targetUrl,
        Instant createdAt
) {
}
