package com.labledger.modules.analytics.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.analytics.dto.DashboardMetricsResponse;
import com.labledger.modules.analytics.dto.InventoryDistributionReport;
import com.labledger.modules.analytics.dto.MaintenanceTrendsReport;
import com.labledger.modules.analytics.dto.OverdueWorkOrderReport;
import com.labledger.modules.analytics.dto.UtilizationReport;
import com.labledger.modules.analytics.service.AnalyticsService;
import com.labledger.modules.analytics.service.CsvExportService;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AnalyticsController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("dev")
class AnalyticsControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnalyticsService analyticsService;

    @MockBean
    private CsvExportService csvExportService;

    @MockBean
    private UserRepository userRepository;

    private User sampleAdminUser;
    private User sampleStudentUser;

    @BeforeEach
    void setUp() {
        sampleAdminUser = User.builder()
                .id(UUID.randomUUID())
                .email("admin@university.edu")
                .passwordHash("hashed")
                .firstName("System")
                .lastName("Administrator")
                .department("Operations")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_ADMIN))
                .build();

        sampleStudentUser = User.builder()
                .id(UUID.randomUUID())
                .email("student@university.edu")
                .passwordHash("hashed")
                .firstName("Elena")
                .lastName("Student")
                .department("Biochemistry")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .build();
    }

    @Test
    @DisplayName("GET /api/v1/analytics/dashboard rejects unauthenticated request with 401")
    void getDashboard_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/dashboard"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/dashboard returns 200 for authenticated user")
    @WithMockUser(username = "admin@university.edu", roles = {"ADMIN"})
    void getDashboard_authenticated_returns200() throws Exception {
        given(userRepository.findByEmailIgnoreCase("admin@university.edu")).willReturn(Optional.of(sampleAdminUser));

        DashboardMetricsResponse response = new DashboardMetricsResponse(
                "STAFF",
                25,
                3,
                5,
                8,
                2,
                1,
                4,
                1,
                64.5,
                1200.0,
                774.0,
                3.5,
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList()
        );

        given(analyticsService.getDashboardMetrics(any(), any())).willReturn(response);

        mockMvc.perform(get("/api/v1/analytics/dashboard"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.role").value("STAFF"))
                .andExpect(jsonPath("$.data.totalActiveEquipment").value(25))
                .andExpect(jsonPath("$.data.overallUtilizationPercentage").value(64.5));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/inventory rejects STUDENT with 403 Forbidden")
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    void getInventoryReport_student_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/analytics/reports/inventory"))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/inventory returns 200 for LAB_ASSISTANT")
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    void getInventoryReport_staff_returns200() throws Exception {
        InventoryDistributionReport report = new InventoryDistributionReport(
                20,
                2,
                BigDecimal.valueOf(500000.00),
                Map.of("Spectrometry", 8L),
                Map.of("AVAILABLE", 16L),
                Map.of("EXCELLENT", 14L),
                Map.of("Physics Central Lab", 20L)
        );

        given(analyticsService.getInventoryDistributionReport(any())).willReturn(report);

        mockMvc.perform(get("/api/v1/analytics/reports/inventory"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalActive").value(20))
                .andExpect(jsonPath("$.data.byCategory.Spectrometry").value(8));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/utilization returns 200 for ADMIN")
    @WithMockUser(username = "admin@university.edu", roles = {"ADMIN"})
    void getUtilizationReport_admin_returns200() throws Exception {
        UtilizationReport report = new UtilizationReport(
                Instant.now().minusSeconds(86400),
                Instant.now(),
                480.0,
                240.0,
                50.0,
                Collections.emptyList()
        );

        given(analyticsService.getUtilizationReport(any())).willReturn(report);

        mockMvc.perform(get("/api/v1/analytics/reports/utilization"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.overallUtilizationPercentage").value(50.0));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/maintenance returns 200 for TECHNICIAN")
    @WithMockUser(username = "technician@university.edu", roles = {"TECHNICIAN"})
    void getMaintenanceReport_technician_returns200() throws Exception {
        MaintenanceTrendsReport report = new MaintenanceTrendsReport(
                Instant.now().minusSeconds(86400),
                Instant.now(),
                12,
                2,
                3,
                9,
                8,
                BigDecimal.valueOf(1250.00),
                BigDecimal.valueOf(45.5),
                4.2,
                Collections.emptyList()
        );

        given(analyticsService.getMaintenanceTrendsReport(any())).willReturn(report);

        mockMvc.perform(get("/api/v1/analytics/reports/maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalFaults").value(12))
                .andExpect(jsonPath("$.data.meanTimeToRepairHours").value(4.2));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/overdue-maintenance returns 200 for LAB_ASSISTANT")
    @WithMockUser(username = "assistant@university.edu", roles = {"LAB_ASSISTANT"})
    void getOverdueReport_staff_returns200() throws Exception {
        OverdueWorkOrderReport item = new OverdueWorkOrderReport(
                UUID.randomUUID(),
                "WO-2026-009",
                "Laser realignment",
                "EQ-PHYS-01",
                "Rigaku XRD",
                "Optics Wing",
                "David Kovacs",
                "HIGH",
                "IN_PROGRESS",
                LocalDate.of(2026, 10, 10),
                18
        );

        given(analyticsService.getOverdueMaintenanceReport(any())).willReturn(List.of(item));

        mockMvc.perform(get("/api/v1/analytics/reports/overdue-maintenance"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].workOrderNumber").value("WO-2026-009"))
                .andExpect(jsonPath("$.data[0].daysOverdue").value(18));
    }

    @Test
    @DisplayName("GET /api/v1/analytics/reports/export/{type} returns CSV file download")
    @WithMockUser(username = "admin@university.edu", roles = {"ADMIN"})
    void exportReport_admin_returnsCsvFile() throws Exception {
        InventoryDistributionReport report = new InventoryDistributionReport(
                5, 0, BigDecimal.TEN, Map.of(), Map.of(), Map.of(), Map.of()
        );
        byte[] csv = "Inventory Dimension,Segment,Asset Count\n".getBytes(StandardCharsets.UTF_8);

        given(analyticsService.getInventoryDistributionReport(any())).willReturn(report);
        given(csvExportService.exportInventoryDistribution(any())).willReturn(csv);

        mockMvc.perform(get("/api/v1/analytics/reports/export/inventory"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("attachment; filename=\"labledger-inventory-")))
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andExpect(content().string("Inventory Dimension,Segment,Asset Count\n"));
    }
}
