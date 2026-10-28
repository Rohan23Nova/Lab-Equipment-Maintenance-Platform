package com.labledger.modules.audit.service;

import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.audit.dto.AuditLogResponse;
import com.labledger.modules.audit.dto.AuditLogSearchCriteria;
import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.audit.model.AuditLog;
import com.labledger.modules.audit.repository.AuditLogRepository;
import com.labledger.modules.audit.repository.AuditLogSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    private static final Pattern SENSITIVE_KEY_PATTERN = Pattern.compile(
            "(?i)\"(password|passwordHash|token|session|secret|cookie|jwt)\"\\s*:\\s*\"[^\"]+\""
    );

    /**
     * Atomically and immutably records an audit history entry within the caller's transaction.
     * Enforces sanitization of credentials, secrets, and session tokens.
     */
    @Transactional
    public AuditLog recordAudit(
            UUID actorId,
            String actorName,
            String actorEmail,
            AuditAction action,
            AuditEntityType entityType,
            UUID entityId,
            String entityIdentifier,
            String summary,
            String detailsJson,
            String ipAddress
    ) {
        String safeActorName = (actorName != null && !actorName.isBlank()) ? actorName.trim() : "System";
        String safeSummary = (summary != null) ? summary.trim() : action.name();

        // Enforce hard redaction of any accidental credentials in JSON payload
        String safeDetailsJson = sanitizeDetails(detailsJson);

        AuditLog entry = AuditLog.builder()
                .actorId(actorId)
                .actorName(safeActorName)
                .actorEmail(actorEmail)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .entityIdentifier(entityIdentifier)
                .summary(safeSummary)
                .detailsJson(safeDetailsJson)
                .ipAddress(ipAddress)
                .build();

        AuditLog saved = auditLogRepository.save(entry);
        log.info("AUDIT [{}] by [{}] on {} {}: {}", action, safeActorName, entityType, entityIdentifier, safeSummary);
        return saved;
    }

    public Page<AuditLogResponse> searchAuditLogs(AuditLogSearchCriteria criteria, Pageable pageable) {
        Specification<AuditLog> spec = AuditLogSpecifications.withCriteria(criteria);
        return auditLogRepository.findAll(spec, pageable).map(AuditLogResponse::fromEntity);
    }

    public AuditLogResponse getAuditLogById(UUID id) {
        return auditLogRepository.findById(id)
                .map(AuditLogResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("Audit Log entry", id));
    }

    public Page<AuditLogResponse> getAuditHistoryForEntity(AuditEntityType entityType, UUID entityId, Pageable pageable) {
        return auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId, pageable)
                .map(AuditLogResponse::fromEntity);
    }

    private String sanitizeDetails(String json) {
        if (json == null || json.isBlank()) {
            return null;
        }
        return SENSITIVE_KEY_PATTERN.matcher(json).replaceAll("\"$1\":\"[REDACTED]\"");
    }
}
