package com.labledger.modules.audit.dto;

import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.audit.model.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record AuditLogResponse(
        UUID id,
        UUID actorId,
        String actorName,
        String actorEmail,
        AuditAction action,
        AuditEntityType entityType,
        UUID entityId,
        String entityIdentifier,
        String summary,
        String detailsJson,
        String ipAddress,
        Instant createdAt
) {
    public static AuditLogResponse fromEntity(AuditLog log) {
        return new AuditLogResponse(
                log.getId(),
                log.getActorId(),
                log.getActorName(),
                log.getActorEmail(),
                log.getAction(),
                log.getEntityType(),
                log.getEntityId(),
                log.getEntityIdentifier(),
                log.getSummary(),
                log.getDetailsJson(),
                log.getIpAddress(),
                log.getCreatedAt()
        );
    }
}
