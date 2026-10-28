package com.labledger.modules.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.inventory.dto.CreateLaboratoryRequest;
import com.labledger.modules.inventory.dto.LaboratoryResponse;
import com.labledger.modules.inventory.dto.UpdateLaboratoryRequest;
import com.labledger.modules.inventory.service.LaboratoryService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(LaboratoryController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class LaboratoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private LaboratoryService laboratoryService;

    @Test
    @DisplayName("GET /api/v1/laboratories - 401 when unauthenticated")
    void listLaboratories_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/laboratories"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/laboratories - authenticated user can list facilities")
    @WithMockUser(roles = "STUDENT")
    void listLaboratories_authenticated_returns200() throws Exception {
        UUID labId = UUID.randomUUID();
        LaboratoryResponse lab = new LaboratoryResponse(
                labId,
                "LAB-MIC-01",
                "Microscopy & Imaging Suite",
                "Discovery Hall",
                "Room 402",
                "Advanced optical and electron microscopy suite",
                true,
                null,
                "Dr. Sarah Jenkins",
                Instant.now(),
                Instant.now()
        );

        when(laboratoryService.getAllLaboratories(false)).thenReturn(List.of(lab));

        mockMvc.perform(get("/api/v1/laboratories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("LAB-MIC-01"))
                .andExpect(jsonPath("$.data[0].managerName").value("Dr. Sarah Jenkins"));
    }

    @Test
    @DisplayName("GET /api/v1/laboratories/{id} - returns 404 when facility does not exist")
    @WithMockUser(roles = "STUDENT")
    void getLaboratoryById_notFound_returns404() throws Exception {
        UUID labId = UUID.randomUUID();
        when(laboratoryService.getLaboratoryById(labId))
                .thenThrow(new ResourceNotFoundException("Laboratory", labId));

        mockMvc.perform(get("/api/v1/laboratories/" + labId))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("POST /api/v1/laboratories - ROLE_ADMIN can create laboratory")
    @WithMockUser(roles = "ADMIN")
    void createLaboratory_asAdmin_returns201() throws Exception {
        UUID labId = UUID.randomUUID();
        CreateLaboratoryRequest request = new CreateLaboratoryRequest(
                "LAB-NANO-01",
                "Nanotechnology Fabrication Bay",
                "Engineering Annex",
                "Cleanroom 101",
                "ISO Class 5 cleanroom facility",
                null
        );

        LaboratoryResponse response = new LaboratoryResponse(
                labId,
                request.code(),
                request.name(),
                request.building(),
                request.roomNumber(),
                request.description(),
                true,
                null,
                null,
                Instant.now(),
                Instant.now()
        );

        when(laboratoryService.createLaboratory(any(CreateLaboratoryRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/laboratories")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("LAB-NANO-01"));
    }

    @Test
    @DisplayName("POST /api/v1/laboratories - duplicate code returns 409 Conflict")
    @WithMockUser(roles = "ADMIN")
    void createLaboratory_duplicateCode_returns409() throws Exception {
        CreateLaboratoryRequest request = new CreateLaboratoryRequest(
                "LAB-NANO-01",
                "Nanotechnology Fabrication Bay",
                "Engineering Annex",
                "Cleanroom 101",
                "ISO Class 5 cleanroom facility",
                null
        );

        when(laboratoryService.createLaboratory(any(CreateLaboratoryRequest.class)))
                .thenThrow(new ConflictException("Laboratory with code 'LAB-NANO-01' already exists"));

        mockMvc.perform(post("/api/v1/laboratories")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("POST /api/v1/laboratories - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(roles = "STUDENT")
    void createLaboratory_asStudent_returns403() throws Exception {
        CreateLaboratoryRequest request = new CreateLaboratoryRequest(
                "LAB-NANO-01",
                "Nanotechnology Fabrication Bay",
                "Engineering Annex",
                "Cleanroom 101",
                "ISO Class 5 cleanroom facility",
                null
        );

        mockMvc.perform(post("/api/v1/laboratories")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("PUT /api/v1/laboratories/{id} - ROLE_LAB_ASSISTANT can update laboratory")
    @WithMockUser(roles = "LAB_ASSISTANT")
    void updateLaboratory_asLabAssistant_returns200() throws Exception {
        UUID labId = UUID.randomUUID();
        UpdateLaboratoryRequest request = new UpdateLaboratoryRequest(
                "Renamed Lab",
                "Engineering Annex",
                "Cleanroom 102",
                "Updated description",
                true,
                null
        );

        LaboratoryResponse response = new LaboratoryResponse(
                labId,
                "LAB-NANO-01",
                request.name(),
                request.building(),
                request.roomNumber(),
                request.description(),
                Boolean.TRUE.equals(request.active()),
                null,
                null,
                Instant.now(),
                Instant.now()
        );

        when(laboratoryService.updateLaboratory(eq(labId), any(UpdateLaboratoryRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/laboratories/" + labId)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Renamed Lab"));
    }
}
