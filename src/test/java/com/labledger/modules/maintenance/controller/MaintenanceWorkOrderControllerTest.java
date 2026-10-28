package com.labledger.modules.maintenance.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.maintenance.dto.*;
import com.labledger.modules.maintenance.model.NoteType;
import com.labledger.modules.maintenance.model.WorkOrderPriority;
import com.labledger.modules.maintenance.model.WorkOrderStatus;
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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(MaintenanceWorkOrderController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("dev")
class MaintenanceWorkOrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private MaintenanceService maintenanceService;

    private final UUID sampleWorkOrderId = UUID.randomUUID();
    private final UUID sampleEquipmentId = UUID.randomUUID();
    private final UUID sampleTechnicianId = UUID.randomUUID();
    private final UUID sampleStaffId = UUID.randomUUID();

    private MaintenanceWorkOrderResponse createSampleWorkOrderResponse() {
        return new MaintenanceWorkOrderResponse(
                sampleWorkOrderId,
                "WO-2026-0001",
                null, null, null,
                sampleEquipmentId,
                "UV-Vis Spectrophotometer",
                "EQ-PHYS-002",
                "Optics Bay",
                sampleTechnicianId,
                "David Kovacs",
                "technician@university.edu",
                sampleStaffId,
                "Sarah Jenkins",
                "Replace deuterium lamp",
                "Optical intensity below calibration threshold",
                WorkOrderPriority.HIGH,
                WorkOrderStatus.ASSIGNED,
                null,
                LocalDate.now(),
                LocalDate.now().plusDays(3),
                null, null,
                BigDecimal.ZERO,
                BigDecimal.ZERO,
                null,
                false,
                null, null, null, null,
                Collections.emptyList(),
                Instant.now(), Instant.now()
        );
    }

    @Test
    @DisplayName("POST /api/v1/work-orders rejects unauthenticated requests with 401 Unauthorized")
    void createWorkOrder_unauthenticated_returns401() throws Exception {
        CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                null, sampleEquipmentId, sampleTechnicianId,
                "Replace deuterium lamp",
                "Description",
                WorkOrderPriority.HIGH,
                LocalDate.now(), LocalDate.now().plusDays(3)
        );

        mockMvc.perform(post("/api/v1/work-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("POST /api/v1/work-orders forbids students with 403 Forbidden")
    void createWorkOrder_studentRole_returns403() throws Exception {
        CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                null, sampleEquipmentId, sampleTechnicianId,
                "Replace deuterium lamp",
                "Description",
                WorkOrderPriority.HIGH,
                LocalDate.now(), LocalDate.now().plusDays(3)
        );

        mockMvc.perform(post("/api/v1/work-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("POST /api/v1/work-orders permits lab assistant to create work order with 201 Created")
    void createWorkOrder_labAssistant_returns201() throws Exception {
        CreateWorkOrderRequest request = new CreateWorkOrderRequest(
                null, sampleEquipmentId, sampleTechnicianId,
                "Replace deuterium lamp",
                "Optical intensity below calibration threshold",
                WorkOrderPriority.HIGH,
                LocalDate.now(), LocalDate.now().plusDays(3)
        );

        when(maintenanceService.createWorkOrder(any(), any())).thenReturn(createSampleWorkOrderResponse());

        mockMvc.perform(post("/api/v1/work-orders")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.workOrderNumber").value("WO-2026-0001"));
    }

    @Test
    @WithMockUser(username = "technician@university.edu", roles = {"TECHNICIAN"})
    @DisplayName("GET /api/v1/work-orders/my-tasks allows technician to view task queue with 200 OK")
    void getTechnicianTasks_technician_returns200() throws Exception {
        MaintenanceWorkOrderSummaryResponse summary = new MaintenanceWorkOrderSummaryResponse(
                sampleWorkOrderId,
                "WO-2026-0001",
                null, null,
                sampleEquipmentId,
                "UV-Vis Spectrophotometer",
                "EQ-PHYS-002",
                "Optics Bay",
                sampleTechnicianId,
                "David Kovacs",
                "Replace deuterium lamp",
                WorkOrderPriority.HIGH,
                WorkOrderStatus.ASSIGNED,
                LocalDate.now().plusDays(3),
                false,
                Instant.now()
        );

        when(maintenanceService.getTechnicianWorkOrders(any(Pageable.class), any()))
                .thenReturn(PageResponse.from(new org.springframework.data.domain.PageImpl<>(List.of(summary))));

        mockMvc.perform(get("/api/v1/work-orders/my-tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].workOrderNumber").value("WO-2026-0001"));
    }

    @Test
    @WithMockUser(username = "technician@university.edu", roles = {"TECHNICIAN"})
    @DisplayName("PATCH /api/v1/work-orders/{id}/complete allows technician to complete work order")
    void completeWorkOrder_technician_returns200() throws Exception {
        CompleteWorkOrderRequest request = new CompleteWorkOrderRequest(
                "Successfully installed replacement deuterium lamp and verified baseline.",
                new BigDecimal("2.50"),
                new BigDecimal("180.00")
        );

        when(maintenanceService.completeWorkOrder(eq(sampleWorkOrderId), any(), any()))
                .thenReturn(createSampleWorkOrderResponse());

        mockMvc.perform(patch("/api/v1/work-orders/" + sampleWorkOrderId + "/complete")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "technician@university.edu", roles = {"TECHNICIAN"})
    @DisplayName("POST /api/v1/work-orders/{id}/return-to-service forbids technician with 403 Forbidden")
    void returnToService_technicianRole_returns403() throws Exception {
        ReturnToServiceRequest request = new ReturnToServiceRequest(
                true,
                "Passed baseline calibration",
                true
        );

        mockMvc.perform(post("/api/v1/work-orders/" + sampleWorkOrderId + "/return-to-service")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    @DisplayName("POST /api/v1/work-orders/{id}/return-to-service permits lab assistant with 200 OK")
    void returnToService_labAssistant_returns200() throws Exception {
        ReturnToServiceRequest request = new ReturnToServiceRequest(
                true,
                "Passed post-repair diagnostic benchmark. Certified safe for research use.",
                true
        );

        when(maintenanceService.returnToService(eq(sampleWorkOrderId), any(), any()))
                .thenReturn(createSampleWorkOrderResponse());

        mockMvc.perform(post("/api/v1/work-orders/" + sampleWorkOrderId + "/return-to-service")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }
}
