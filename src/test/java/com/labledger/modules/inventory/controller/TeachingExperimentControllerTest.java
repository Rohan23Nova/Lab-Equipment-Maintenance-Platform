package com.labledger.modules.inventory.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.inventory.dto.ExperimentDetailResponse;
import com.labledger.modules.inventory.dto.ExperimentSummaryResponse;
import com.labledger.modules.inventory.service.TeachingExperimentService;
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
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeachingExperimentController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class TeachingExperimentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TeachingExperimentService experimentService;

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/v1/experiments returns 200 with experiment summaries")
    void listExperiments_authenticated_returns200() throws Exception {
        UUID expId = UUID.randomUUID();
        UUID labId = UUID.randomUUID();
        var exp = new ExperimentSummaryResponse(
                expId,
                "EXP-PHY-01",
                "Measurement of Dimensions using Vernier Caliper",
                "Engineering Physics",
                "To determine dimensions and volume of solids",
                labId,
                "Engineering Physics Laboratory",
                "PHY-101",
                "Manual Ex-01",
                true,
                2
        );

        when(experimentService.getAllExperiments(null, null)).thenReturn(List.of(exp));

        mockMvc.perform(get("/api/v1/experiments")
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("EXP-PHY-01"))
                .andExpect(jsonPath("$.data[0].title").value("Measurement of Dimensions using Vernier Caliper"))
                .andExpect(jsonPath("$.data[0].laboratoryCode").value("PHY-101"))
                .andExpect(jsonPath("$.data[0].equipmentCount").value(2));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/v1/experiments/{id} returns 200 with full details and required instruments")
    void getExperimentById_exists_returns200() throws Exception {
        UUID expId = UUID.randomUUID();
        UUID labId = UUID.randomUUID();
        var detail = new ExperimentDetailResponse(
                expId,
                "EXP-ELE-01",
                "Verification of Kirchhoff's Laws",
                "Basic Electrical Engineering",
                "To verify KCL and KVL in multi-loop circuits",
                "Students construct mesh resistive networks and measure node potentials.",
                labId,
                "Basic Electrical Engineering Laboratory",
                "ELE-101",
                "Manual Ex-01, pp. 5-11",
                true,
                Collections.emptyList(),
                Instant.now(),
                Instant.now()
        );

        when(experimentService.getExperimentById(expId)).thenReturn(detail);

        mockMvc.perform(get("/api/v1/experiments/{id}", expId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.code").value("EXP-ELE-01"))
                .andExpect(jsonPath("$.data.subject").value("Basic Electrical Engineering"))
                .andExpect(jsonPath("$.data.laboratoryCode").value("ELE-101"));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/v1/experiments/{id} returns 404 when not found")
    void getExperimentById_notFound_returns404() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(experimentService.getExperimentById(nonExistentId))
                .thenThrow(new ResourceNotFoundException("Teaching experiment not found"));

        mockMvc.perform(get("/api/v1/experiments/{id}", nonExistentId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    @DisplayName("GET /api/v1/experiments/by-equipment/{id} returns 200 with linked curriculum practicals")
    void getExperimentsByEquipment_returns200() throws Exception {
        UUID equipmentId = UUID.randomUUID();
        UUID labId = UUID.randomUUID();
        var exp = new ExperimentSummaryResponse(
                UUID.randomUUID(),
                "EXP-ECE-01",
                "Familiarization with Digital Storage Oscilloscope",
                "Basic Electronics",
                "To measure wave parameters and frequencies",
                labId,
                "Basic Electronics Laboratory",
                "ECE-101",
                "Manual Ex-01",
                true,
                1
        );

        when(experimentService.getExperimentsByEquipmentId(equipmentId)).thenReturn(List.of(exp));

        mockMvc.perform(get("/api/v1/experiments/by-equipment/{id}", equipmentId)
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].code").value("EXP-ECE-01"));
    }
}
