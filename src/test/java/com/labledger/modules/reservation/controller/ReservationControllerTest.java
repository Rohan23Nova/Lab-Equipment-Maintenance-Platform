package com.labledger.modules.reservation.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.BusinessRuleException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.reservation.dto.*;
import com.labledger.modules.reservation.model.ReservationStatus;
import com.labledger.modules.reservation.service.ReservationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReservationController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ReservationService reservationService;

    private ReservationResponse createSampleResponse(UUID id, UUID eqId, UUID userId, ReservationStatus status) {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        return new ReservationResponse(
                id,
                eqId,
                "Zeiss Axio Observer 7",
                "EQ-PHYS-001",
                "Microscopy Suite",
                "LAB-MIC-01",
                userId,
                "Elena Rostova",
                "student@university.edu",
                start,
                end,
                "Live cell confocal imaging",
                status,
                null,
                null,
                null,
                null,
                null,
                Instant.now(),
                Instant.now()
        );
    }

    private ReservationSummaryResponse createSampleSummary(UUID id, UUID eqId, UUID userId, ReservationStatus status) {
        Instant start = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        return new ReservationSummaryResponse(
                id,
                eqId,
                "Zeiss Axio Observer 7",
                "EQ-PHYS-001",
                "Microscopy Suite",
                "LAB-MIC-01",
                userId,
                "Elena Rostova",
                start,
                end,
                "Live cell confocal imaging",
                status,
                Instant.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/reservations - unauthenticated returns 401")
    void createReservation_unauthenticated_returns401() throws Exception {
        UUID eqId = UUID.randomUUID();
        CreateReservationRequest request = new CreateReservationRequest(
                eqId,
                Instant.now().plus(1, ChronoUnit.DAYS),
                Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                "Sample experiment purpose"
        );

        mockMvc.perform(post("/api/v1/reservations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/v1/reservations - student creates booking request successfully returns 201")
    @WithMockUser(username = "student@university.edu", roles = "STUDENT")
    void createReservation_validStudentPayload_returns201() throws Exception {
        UUID resId = UUID.randomUUID();
        UUID eqId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        Instant start = Instant.now().plus(1, ChronoUnit.DAYS);
        Instant end = start.plus(2, ChronoUnit.HOURS);

        CreateReservationRequest request = new CreateReservationRequest(
                eqId,
                start,
                end,
                "Cell culture fluorescent tagging time-lapse microscopy experiment"
        );

        ReservationResponse response = createSampleResponse(resId, eqId, userId, ReservationStatus.PENDING);
        when(reservationService.createReservation(any(CreateReservationRequest.class), any(Authentication.class)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/reservations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.equipmentAssetTag").value("EQ-PHYS-001"));
    }

    @Test
    @DisplayName("POST /api/v1/reservations - schedule collision returns 409 Conflict")
    @WithMockUser(username = "student@university.edu", roles = "STUDENT")
    void createReservation_overlappingSlot_returns409() throws Exception {
        UUID eqId = UUID.randomUUID();
        CreateReservationRequest request = new CreateReservationRequest(
                eqId,
                Instant.now().plus(1, ChronoUnit.DAYS),
                Instant.now().plus(1, ChronoUnit.DAYS).plus(2, ChronoUnit.HOURS),
                "Overlapping booking request"
        );

        when(reservationService.createReservation(any(CreateReservationRequest.class), any(Authentication.class)))
                .thenThrow(new ConflictException("The selected time slot overlaps with an existing reservation"));

        mockMvc.perform(post("/api/v1/reservations")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/my - student retrieves own reservations")
    @WithMockUser(username = "student@university.edu", roles = "STUDENT")
    void getMyReservations_returns200() throws Exception {
        UUID resId = UUID.randomUUID();
        ReservationSummaryResponse summary = createSampleSummary(resId, UUID.randomUUID(), UUID.randomUUID(), ReservationStatus.APPROVED);

        when(reservationService.getUserReservations(any(Authentication.class), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(summary)));

        mockMvc.perform(get("/api/v1/reservations/my"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].status").value("APPROVED"));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/approvals - ROLE_ADMIN can view queue")
    @WithMockUser(roles = "ADMIN")
    void getApprovalsQueue_asAdmin_returns200() throws Exception {
        UUID resId = UUID.randomUUID();
        ReservationSummaryResponse summary = createSampleSummary(resId, UUID.randomUUID(), UUID.randomUUID(), ReservationStatus.PENDING);

        when(reservationService.getPendingApprovalsQueue(any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(summary)));

        mockMvc.perform(get("/api/v1/reservations/approvals"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("GET /api/v1/reservations/approvals - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(roles = "STUDENT")
    void getApprovalsQueue_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/reservations/approvals"))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("PATCH /api/v1/reservations/{id}/approve - staff approves reservation returns 200")
    @WithMockUser(username = "assistant@university.edu", roles = "LAB_ASSISTANT")
    void approveReservation_asStaff_returns200() throws Exception {
        UUID resId = UUID.randomUUID();
        ReservationResponse approved = createSampleResponse(resId, UUID.randomUUID(), UUID.randomUUID(), ReservationStatus.APPROVED);

        when(reservationService.approveReservation(eq(resId), any(Authentication.class)))
                .thenReturn(approved);

        mockMvc.perform(patch("/api/v1/reservations/" + resId + "/approve")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("APPROVED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/reservations/{id}/approve - self-approval attempt returns 422 BusinessRuleException")
    @WithMockUser(username = "assistant@university.edu", roles = "LAB_ASSISTANT")
    void approveReservation_selfApprovalAttempt_returns422() throws Exception {
        UUID resId = UUID.randomUUID();
        when(reservationService.approveReservation(eq(resId), any(Authentication.class)))
                .thenThrow(new BusinessRuleException("Staff members are not permitted to approve their own reservation requests"));

        mockMvc.perform(patch("/api/v1/reservations/" + resId + "/approve")
                        .with(csrf()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Business Rule Violation"))
                .andExpect(jsonPath("$.status").value(422));
    }

    @Test
    @DisplayName("PATCH /api/v1/reservations/{id}/reject - staff rejects reservation returns 200")
    @WithMockUser(username = "assistant@university.edu", roles = "LAB_ASSISTANT")
    void rejectReservation_asStaff_returns200() throws Exception {
        UUID resId = UUID.randomUUID();
        RejectReservationRequest request = new RejectReservationRequest("Facility closed for emergency decontamination");
        ReservationResponse rejected = createSampleResponse(resId, UUID.randomUUID(), UUID.randomUUID(), ReservationStatus.REJECTED);

        when(reservationService.rejectReservation(eq(resId), any(RejectReservationRequest.class), any(Authentication.class)))
                .thenReturn(rejected);

        mockMvc.perform(patch("/api/v1/reservations/" + resId + "/reject")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("REJECTED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/reservations/{id}/cancel - user cancels reservation returns 200")
    @WithMockUser(username = "student@university.edu", roles = "STUDENT")
    void cancelReservation_asUser_returns200() throws Exception {
        UUID resId = UUID.randomUUID();
        CancelReservationRequest request = new CancelReservationRequest("Sample prep postponed");
        ReservationResponse cancelled = createSampleResponse(resId, UUID.randomUUID(), UUID.randomUUID(), ReservationStatus.CANCELLED);

        when(reservationService.cancelReservation(eq(resId), any(), any(Authentication.class)))
                .thenReturn(cancelled);

        mockMvc.perform(patch("/api/v1/reservations/" + resId + "/cancel")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}
