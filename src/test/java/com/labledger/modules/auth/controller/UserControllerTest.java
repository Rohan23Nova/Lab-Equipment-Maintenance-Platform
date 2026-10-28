package com.labledger.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.auth.dto.CreateUserRequest;
import com.labledger.modules.auth.dto.UpdateUserStatusRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("POST /api/v1/users - public registration with valid payload returns 201")
    void createUser_withValidPayload_returns201Created() throws Exception {
        UUID userId = UUID.randomUUID();
        CreateUserRequest request = new CreateUserRequest(
                "researcher@university.edu",
                "StrongPassword123!",
                "Elena",
                "Rostova",
                "Materials Science",
                Set.of(UserRole.ROLE_STUDENT)
        );

        UserResponse mockResponse = new UserResponse(
                userId,
                "researcher@university.edu",
                "Elena",
                "Rostova",
                "Materials Science",
                UserStatus.ACTIVE,
                Set.of(UserRole.ROLE_STUDENT),
                Instant.now()
        );

        when(userService.createUser(any(CreateUserRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("researcher@university.edu"))
                .andExpect(jsonPath("$.data.id").value(userId.toString()));
    }

    @Test
    @DisplayName("POST /api/v1/users - invalid fields returns 400 ProblemDetail")
    void createUser_withInvalidFields_returns400ProblemDetail() throws Exception {
        CreateUserRequest invalidRequest = new CreateUserRequest(
                "not-an-email",
                "short",
                "",
                "Rostova",
                "Materials Science",
                Set.of(UserRole.ROLE_STUDENT)
        );

        mockMvc.perform(post("/api/v1/users")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.invalidParams").isArray());
    }

    @Test
    @DisplayName("PATCH /api/v1/users/{id}/status - ROLE_ADMIN can update status to SUSPENDED")
    @WithMockUser(roles = "ADMIN")
    void updateUserStatus_asAdmin_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.SUSPENDED);

        UserResponse mockResponse = new UserResponse(
                userId,
                "student@university.edu",
                "Elena",
                "Rostova",
                "Materials Science",
                UserStatus.SUSPENDED,
                Set.of(UserRole.ROLE_STUDENT),
                Instant.now()
        );

        when(userService.updateUserStatus(eq(userId), eq(UserStatus.SUSPENDED)))
                .thenReturn(mockResponse);

        mockMvc.perform(patch("/api/v1/users/" + userId + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("SUSPENDED"));
    }

    @Test
    @DisplayName("PATCH /api/v1/users/{id}/status - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(roles = "STUDENT")
    void updateUserStatus_asStudent_returns403() throws Exception {
        UUID userId = UUID.randomUUID();
        UpdateUserStatusRequest request = new UpdateUserStatusRequest(UserStatus.SUSPENDED);

        mockMvc.perform(patch("/api/v1/users/" + userId + "/status")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Forbidden"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("GET /api/v1/users - ROLE_LAB_ASSISTANT can list users")
    @WithMockUser(roles = "LAB_ASSISTANT")
    void getAllUsers_asLabAssistant_returns200() throws Exception {
        when(userService.getAllUsers(any())).thenReturn(new PageImpl<>(List.of()));

        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("GET /api/v1/users - ROLE_STUDENT is forbidden (returns 403)")
    @WithMockUser(roles = "STUDENT")
    void getAllUsers_asStudent_returns403() throws Exception {
        mockMvc.perform(get("/api/v1/users"))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.status").value(403));
    }
}
