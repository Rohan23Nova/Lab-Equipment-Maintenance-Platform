package com.labledger.modules.audit.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.audit.dto.AuditLogResponse;
import com.labledger.modules.audit.model.AuditAction;
import com.labledger.modules.audit.model.AuditEntityType;
import com.labledger.modules.audit.service.AuditService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuditLogController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("dev")
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuditService auditService;

    @Test
    @DisplayName("GET /api/v1/audit-logs rejects unauthenticated request with 401")
    void searchAuditLogs_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("GET /api/v1/audit-logs rejects student access with 403 Forbidden")
    void searchAuditLogs_studentRole_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@university.edu", roles = {"ADMIN"})
    @DisplayName("GET /api/v1/audit-logs allows admin access and returns paginated logs")
    void searchAuditLogs_adminRole_returns200() throws Exception {
        AuditLogResponse logEntry = new AuditLogResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Sarah Assistant",
                "assistant@university.edu",
                AuditAction.EQUIPMENT_STATUS_CHANGED,
                AuditEntityType.EQUIPMENT,
                UUID.randomUUID(),
                "EQ-PHYS-001",
                "Instrument status transitioned from AVAILABLE to UNDER_MAINTENANCE",
                "{\"reason\":\"Annual calibration overhaul\"}",
                "127.0.0.1",
                Instant.now()
        );

        given(auditService.searchAuditLogs(any(), any()))
                .willReturn(new PageImpl<>(List.of(logEntry), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/audit-logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].action").value("EQUIPMENT_STATUS_CHANGED"))
                .andExpect(jsonPath("$.data.content[0].entityIdentifier").value("EQ-PHYS-001"));
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("GET /api/v1/audit-logs/{id} returns specific audit log details")
    void getAuditLogById_staffRole_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        AuditLogResponse logEntry = new AuditLogResponse(
                id,
                UUID.randomUUID(),
                "Dr. Sarah Jenkins",
                "jenkins@university.edu",
                AuditAction.RESERVATION_APPROVED,
                AuditEntityType.RESERVATION,
                UUID.randomUUID(),
                "EQ-PHYS-001",
                "Reservation approved for Alice Student",
                "{\"approvedBy\":\"Dr. Sarah Jenkins\"}",
                null,
                Instant.now()
        );

        given(auditService.getAuditLogById(eq(id))).willReturn(logEntry);

        mockMvc.perform(get("/api/v1/audit-logs/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.action").value("RESERVATION_APPROVED"));
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("GET /api/v1/audit-logs/entity/{type}/{id} returns entity audit history")
    void getEntityAuditHistory_staffRole_returns200() throws Exception {
        UUID entityId = UUID.randomUUID();
        AuditLogResponse logEntry = new AuditLogResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Admin",
                "admin@university.edu",
                AuditAction.EQUIPMENT_CREATED,
                AuditEntityType.EQUIPMENT,
                entityId,
                "EQ-PHYS-001",
                "New instrument registered",
                null,
                null,
                Instant.now()
        );

        given(auditService.getAuditHistoryForEntity(eq(AuditEntityType.EQUIPMENT), eq(entityId), any()))
                .willReturn(new PageImpl<>(List.of(logEntry), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/v1/audit-logs/entity/EQUIPMENT/{id}", entityId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].entityType").value("EQUIPMENT"));
    }
}
