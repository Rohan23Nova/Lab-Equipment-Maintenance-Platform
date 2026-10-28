package com.labledger.modules.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.inventory.dto.*;
import com.labledger.modules.inventory.model.EquipmentCondition;
import com.labledger.modules.inventory.model.EquipmentStatus;
import com.labledger.modules.inventory.service.EquipmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(EquipmentController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class EquipmentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private EquipmentService equipmentService;

    private EquipmentSummaryResponse createSampleSummary(UUID id, String tag, String name, EquipmentStatus status) {
        return new EquipmentSummaryResponse(
                id,
                tag,
                name,
                "Microscopes",
                UUID.randomUUID(),
                "Imaging Lab",
                "LAB-01",
                UUID.randomUUID(),
                "Zeiss",
                "Axio Observer 7",
                EquipmentCondition.GOOD,
                status,
                Instant.now()
        );
    }

    private EquipmentResponse createSampleResponse(UUID id, String tag, String name, EquipmentStatus status) {
        UUID labId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        LaboratoryResponse lab = new LaboratoryResponse(
                labId, "LAB-01", "Imaging Lab", "Discovery Hall", "401", null, true, null, null, Instant.now(), Instant.now()
        );
        EquipmentCategoryResponse cat = new EquipmentCategoryResponse(
                catId, "MICR", "Microscopes", "Optical instruments", Instant.now()
        );

        return new EquipmentResponse(
                id,
                tag,
                name,
                cat,
                lab,
                "Zeiss",
                "Axio Observer 7",
                "SN-12345",
                EquipmentCondition.GOOD,
                status,
                LocalDate.of(2023, 1, 15),
                new BigDecimal("75000.00"),
                LocalDate.of(2026, 1, 15),
                "Inverted research microscope",
                "{\"magnification\":\"100x\"}",
                Instant.now(),
                Instant.now(),
                List.of(),
                List.of()
        );
    }

    @Test
    @DisplayName("GET /api/v1/equipment - unauthenticated returns 401")
    void listEquipment_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/equipment"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/equipment - student can list instruments with pagination")
    @WithMockUser(roles = "STUDENT")
    void listEquipment_authenticated_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        EquipmentSummaryResponse summary = createSampleSummary(id, "EQ-MIC-001", "Zeiss Confocal", EquipmentStatus.AVAILABLE);
        PageResponse<EquipmentSummaryResponse> pageResponse = new PageResponse<>(
                List.of(summary),
                0,
                20,
                1L,
                1,
                true,
                true
        );

        when(equipmentService.findEquipment(any(EquipmentSearchCriteria.class), any(Pageable.class)))
                .thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/equipment")
                        .param("query", "Zeiss")
                        .param("status", "AVAILABLE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].assetTag").value("EQ-MIC-001"))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test
    @DisplayName("GET /api/v1/equipment/{id} - returns detailed instrument profile")
    @WithMockUser(roles = "STUDENT")
    void getEquipmentById_existing_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        EquipmentResponse response = createSampleResponse(id, "EQ-MIC-001", "Zeiss Confocal", EquipmentStatus.AVAILABLE);

        when(equipmentService.getEquipmentById(id)).thenReturn(response);

        mockMvc.perform(get("/api/v1/equipment/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assetTag").value("EQ-MIC-001"))
                .andExpect(jsonPath("$.data.laboratory.code").value("LAB-01"));
    }

    @Test
    @DisplayName("GET /api/v1/equipment/{id} - returns 404 when not found")
    @WithMockUser(roles = "STUDENT")
    void getEquipmentById_notFound_returns404() throws Exception {
        UUID id = UUID.randomUUID();
        when(equipmentService.getEquipmentById(id))
                .thenThrow(new ResourceNotFoundException("Equipment", id));

        mockMvc.perform(get("/api/v1/equipment/" + id))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/v1/equipment - ROLE_ADMIN can create equipment instrument")
    @WithMockUser(username = "admin@university.edu", roles = "ADMIN")
    void createEquipment_asAdmin_returns201() throws Exception {
        UUID labId = UUID.randomUUID();
        UUID catId = UUID.randomUUID();
        UUID eqId = UUID.randomUUID();

        CreateEquipmentRequest request = new CreateEquipmentRequest(
                "EQ-SPECTRO-001",
                "Agilent Cary 60 UV-Vis",
                catId,
                labId,
                "Agilent",
                "Cary 60",
                "MY21349001",
                EquipmentCondition.NEW,
                EquipmentStatus.AVAILABLE,
                LocalDate.of(2024, 2, 1),
                new BigDecimal("18500.00"),
                LocalDate.of(2027, 2, 1),
                "Spectrophotometer for kinetic measurements",
                "{\"spectral_range\":\"190-1100 nm\"}"
        );

        EquipmentResponse response = createSampleResponse(eqId, "EQ-SPECTRO-001", "Agilent Cary 60 UV-Vis", EquipmentStatus.AVAILABLE);

        when(equipmentService.createEquipment(any(CreateEquipmentRequest.class), any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/equipment")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.assetTag").value("EQ-SPECTRO-001"));
    }

    @Test
    @DisplayName("POST /api/v1/equipment - duplicate asset tag returns 409 Conflict")
    @WithMockUser(username = "admin@university.edu", roles = "ADMIN")
    void createEquipment_duplicateTag_returns409() throws Exception {
        CreateEquipmentRequest request = new CreateEquipmentRequest(
                "EQ-DUPLICATE",
                "Duplicate Device",
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Vendor",
                "Model",
                null,
                EquipmentCondition.GOOD,
                EquipmentStatus.AVAILABLE,
                null,
                null,
                null,
                null,
                null
        );

        when(equipmentService.createEquipment(any(CreateEquipmentRequest.class), any(Authentication.class)))
                .thenThrow(new ConflictException("Equipment with asset tag 'EQ-DUPLICATE' already exists"));

        mockMvc.perform(post("/api/v1/equipment")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("POST /api/v1/equipment - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(username = "student@university.edu", roles = "STUDENT")
    void createEquipment_asStudent_returns403() throws Exception {
        CreateEquipmentRequest request = new CreateEquipmentRequest(
                "EQ-SPECTRO-001",
                "Agilent Cary 60 UV-Vis",
                UUID.randomUUID(),
                UUID.randomUUID(),
                "Agilent",
                "Cary 60",
                null,
                EquipmentCondition.NEW,
                EquipmentStatus.AVAILABLE,
                null,
                null,
                null,
                null,
                null
        );

        mockMvc.perform(post("/api/v1/equipment")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("PATCH /api/v1/equipment/{id}/status - ROLE_TECHNICIAN can transition status")
    @WithMockUser(username = "tech@university.edu", roles = "TECHNICIAN")
    void updateEquipmentStatus_asTechnician_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        EquipmentStatusUpdateRequest request = new EquipmentStatusUpdateRequest(
                EquipmentStatus.UNDER_MAINTENANCE,
                "Laser optical realignment required",
                "Power output dropped below threshold during calibration"
        );

        EquipmentResponse response = createSampleResponse(id, "EQ-MIC-001", "Zeiss Confocal", EquipmentStatus.UNDER_MAINTENANCE);

        when(equipmentService.updateEquipmentStatus(eq(id), any(EquipmentStatusUpdateRequest.class), any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/equipment/" + id + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UNDER_MAINTENANCE"));
    }

    @Test
    @DisplayName("PATCH /api/v1/equipment/{id}/archive - ROLE_ADMIN can safely archive equipment")
    @WithMockUser(username = "admin@university.edu", roles = "ADMIN")
    void archiveEquipment_asAdmin_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        EquipmentResponse response = createSampleResponse(id, "EQ-MIC-001", "Zeiss Confocal", EquipmentStatus.ARCHIVED);

        when(equipmentService.archiveEquipment(eq(id), any(String.class), any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(patch("/api/v1/equipment/" + id + "/archive")
                        .with(csrf())
                        .param("reason", "Decommissioned due to age"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ARCHIVED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/equipment/{id}/archive - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(roles = "STUDENT")
    void archiveEquipment_asStudent_returns403() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(patch("/api/v1/equipment/" + id + "/archive")
                        .with(csrf()))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("GET /api/v1/equipment/{id}/history - returns audit history ledger")
    @WithMockUser(roles = "STUDENT")
    void getEquipmentHistory_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        EquipmentStatusHistoryResponse entry = new EquipmentStatusHistoryResponse(
                UUID.randomUUID(),
                EquipmentStatus.AVAILABLE,
                EquipmentStatus.UNDER_MAINTENANCE,
                "Admin User",
                "admin@university.edu",
                "Maintenance required",
                "Filter replacement scheduled",
                Instant.now()
        );

        when(equipmentService.getEquipmentHistory(id)).thenReturn(List.of(entry));

        mockMvc.perform(get("/api/v1/equipment/" + id + "/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].newStatus").value("UNDER_MAINTENANCE"))
                .andExpect(jsonPath("$.data[0].reason").value("Maintenance required"));
    }
}
