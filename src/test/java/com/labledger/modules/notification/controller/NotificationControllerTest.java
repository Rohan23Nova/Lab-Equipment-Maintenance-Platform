package com.labledger.modules.notification.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.notification.dto.NotificationPreferenceResponse;
import com.labledger.modules.notification.dto.NotificationResponse;
import com.labledger.modules.notification.dto.UnreadCountResponse;
import com.labledger.modules.notification.dto.UpdatePreferencesRequest;
import com.labledger.modules.notification.model.NotificationChannel;
import com.labledger.modules.notification.model.NotificationType;
import com.labledger.modules.notification.service.NotificationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(NotificationController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
@ActiveProfiles("dev")
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private NotificationService notificationService;

    @Test
    @DisplayName("GET /api/v1/notifications rejects unauthenticated user with 401")
    void getNotifications_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("GET /api/v1/notifications returns paginated notifications for current user")
    void getNotifications_authenticated_returns200() throws Exception {
        NotificationResponse item = new NotificationResponse(
                UUID.randomUUID(),
                UUID.randomUUID(),
                NotificationType.RESERVATION_APPROVED,
                "Reservation Confirmed",
                "Your booking for X-Ray Diffractometer is approved.",
                "/app/reservations",
                false,
                null,
                NotificationChannel.IN_APP,
                Instant.now()
        );

        given(notificationService.getNotifications(any(), any(), any()))
                .willReturn(new PageImpl<>(List.of(item), PageRequest.of(0, 15), 1));

        mockMvc.perform(get("/api/v1/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].title").value("Reservation Confirmed"))
                .andExpect(jsonPath("$.data.content[0].type").value("RESERVATION_APPROVED"));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("GET /api/v1/notifications/unread-count returns unread count")
    void getUnreadCount_authenticated_returns200() throws Exception {
        given(notificationService.getUnreadCount(any()))
                .willReturn(new UnreadCountResponse(5));

        mockMvc.perform(get("/api/v1/notifications/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(5));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("PATCH /api/v1/notifications/{id}/read marks single notification as read")
    void markAsRead_authenticated_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        NotificationResponse item = new NotificationResponse(
                id,
                UUID.randomUUID(),
                NotificationType.RESERVATION_APPROVED,
                "Reservation Confirmed",
                "Your booking is approved.",
                "/app/reservations",
                true,
                Instant.now(),
                NotificationChannel.IN_APP,
                Instant.now()
        );

        given(notificationService.markAsRead(eq(id), any())).willReturn(item);

        mockMvc.perform(patch("/api/v1/notifications/{id}/read", id).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("POST /api/v1/notifications/mark-all-read marks all as read")
    void markAllAsRead_authenticated_returns200() throws Exception {
        given(notificationService.markAllAsRead(any()))
                .willReturn(new UnreadCountResponse(0));

        mockMvc.perform(post("/api/v1/notifications/mark-all-read").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.count").value(0));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("GET /api/v1/notifications/preferences returns user preference toggles")
    void getPreferences_authenticated_returns200() throws Exception {
        NotificationPreferenceResponse prefs = new NotificationPreferenceResponse(
                true, true, true, 2, true, true, Instant.now()
        );
        given(notificationService.getPreferences(any())).willReturn(prefs);

        mockMvc.perform(get("/api/v1/notifications/preferences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailEnabled").value(true))
                .andExpect(jsonPath("$.data.reminderLeadHours").value(2));
    }

    @Test
    @WithMockUser(username = "student@university.edu", roles = {"STUDENT"})
    @DisplayName("PUT /api/v1/notifications/preferences updates preferences with validation")
    void updatePreferences_valid_returns200() throws Exception {
        UpdatePreferencesRequest request = new UpdatePreferencesRequest(
                false, true, true, 4, true, false
        );

        NotificationPreferenceResponse updated = new NotificationPreferenceResponse(
                false, true, true, 4, true, false, Instant.now()
        );
        given(notificationService.updatePreferences(any(), any())).willReturn(updated);

        mockMvc.perform(put("/api/v1/notifications/preferences")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.emailEnabled").value(false))
                .andExpect(jsonPath("$.data.reminderLeadHours").value(4));
    }
}
