package com.labledger.modules.audit.dto;

import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;

import java.time.Instant;
import java.util.UUID;

public record AuditLogSearchCriteria(
        AuditEntityType entityType,
        AuditAction action,
        UUID actorId,
        String search,
        Instant fromTimestamp,
        Instant toTimestamp
) {}
