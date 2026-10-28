package com.labledger.modules.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.model.FaultSeverity;
import com.labledger.modules.maintenance.model.FaultStatus;
import com.labledger.modules.maintenance.service.MaintenanceService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(FaultReportController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("dev")
class FaultReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MaintenanceService maintenanceService;

    private final UUID sampleFaultId = UUID.randomUUID();
    private final UUID sampleEquipmentId = UUID.randomUUID();
    private final UUID sampleReporterId = UUID.randomUUID();

    private FaultReportResponse createSampleFaultResponse() {
        return new FaultReportResponse(
                sampleFaultId,
                "FLT-2026-0001",
                sampleEquipmentId,
                "Laser Confocal Microscope",
                "EQ-PHYS-001",
                "Materials Physics Bay",
                sampleReporterId,
                "Alice Johnson",
                "alice.johnson@university.edu",
                "Laser emission diode failure",
                "Laser 488nm fails to initialize during calibration",
                FaultSeverity.CRITICAL,
                FaultStatus.OPEN,
                Instant.now(),
                null, null, null, null,
                null, null, null, null,
                null, null, null,
                Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/faults rejects unauthenticated requests with 401 Unauthorized")
    void reportFault_unauthenticated_returns401() throws Exception {
        CreateFaultReportRequest request = new CreateFaultReportRequest(
                sampleEquipmentId,
                "Laser emission diode failure",
                "Laser 488nm fails to initialize",
                FaultSeverity.HIGH
        );

        mockMvc.perform(post("/api/v1/faults")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "alice.johnson@university.edu", roles = {"STUDENT"})
    @DisplayName("POST /api/v1/faults allows authenticated students to report faults with 201 Created")
    void reportFault_authenticatedStudent_returns201() throws Exception {
        CreateFaultReportRequest request = new CreateFaultReportRequest(
                sampleEquipmentId,
                "Laser emission diode failure",
                "Laser 488nm fails to initialize during calibration",
                FaultSeverity.CRITICAL
        );

        when(maintenanceService.reportFault(any(), any())).thenReturn(createSampleFaultResponse());

        mockMvc.perform(post("/api/v1/faults")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.faultNumber").value("FLT-2026-0001"))
                .andExpect(jsonPath("$.data.severity").value("CRITICAL"));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("PATCH /api/v1/faults/{id}/triage forbids students with 403 Forbidden")
    void triageFault_studentRole_returns403() throws Exception {
        TriageFaultReportRequest request = new TriageFaultReportRequest(
                FaultStatus.TRIAGED,
                "Verified issue",
                true
        );

        mockMvc.perform(patch("/api/v1/faults/" + sampleFaultId + "/triage")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("PATCH /api/v1/faults/{id}/triage permits lab assistant to triage with 200 OK")
    void triageFault_labAssistant_returns200() throws Exception {
        TriageFaultReportRequest request = new TriageFaultReportRequest(
                FaultStatus.TRIAGED,
                "Verified sensor diode failure. Ordering replacement part.",
                true
        );

        FaultReportResponse response = createSampleFaultResponse();
        when(maintenanceService.triageFault(eq(sampleFaultId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/api/v1/faults/" + sampleFaultId + "/triage")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.faultNumber").value("FLT-2026-0001"));
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("PATCH /api/v1/faults/{id}/close permits lab assistant to close report with 200 OK")
    void closeFault_labAssistant_returns200() throws Exception {
        when(maintenanceService.closeFault(eq(sampleFaultId), any())).thenReturn(createSampleFaultResponse());

        mockMvc.perform(patch("/api/v1/faults/" + sampleFaultId + "/close")
                        .with(csrf()))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("GET /api/v1/faults allows authenticated users to browse fault summaries with 200 OK")
    void findFaults_authenticated_returns200() throws Exception {
        FaultReportSummaryResponse summary = new FaultReportSummaryResponse(
                sampleFaultId,
                "FLT-2026-0001",
                sampleEquipmentId,
                "Laser Confocal Microscope",
                "EQ-PHYS-001",
                "Materials Physics Bay",
                sampleReporterId,
                "Alice Johnson",
                "Laser emission diode failure",
                FaultSeverity.CRITICAL,
                FaultStatus.OPEN,
                Instant.now(),
                Instant.now()
        );

        PageResponse<FaultReportSummaryResponse> pageResponse = PageResponse.from(
                new org.springframework.data.domain.PageImpl<>(List.of(summary))
        );

        when(maintenanceService.findFaults(any(), any(Pageable.class))).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/faults"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].faultNumber").value("FLT-2026-0001"));
    }
}
