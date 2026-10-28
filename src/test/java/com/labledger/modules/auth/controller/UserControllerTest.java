package com.labledger.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.config.SecurityConfig;
import com.labledger.modules.auth.dto.CreateUserRequest;
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
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class})
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("POST /api/v1/users - valid payload returns 201 Created with structured ApiResponse")
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("researcher@university.edu"))
                .andExpect(jsonPath("$.data.firstName").value("Elena"))
                .andExpect(jsonPath("$.data.id").value(userId.toString()));
    }

    @Test
    @DisplayName("POST /api/v1/users - invalid email and short password returns 400 with RFC 7807 ProblemDetail")
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
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Validation Failed"))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.invalidParams").isArray())
                .andExpect(jsonPath("$.invalidParams.length()").value(3));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} - existing ID returns 200 OK")
    void getUserById_whenFound_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        UserResponse mockResponse = new UserResponse(
                userId,
                "faculty@university.edu",
                "David",
                "Vance",
                "Physics",
                UserStatus.ACTIVE,
                Set.of(UserRole.ROLE_FACULTY),
                Instant.now()
        );

        when(userService.getUserById(userId)).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/users/" + userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("faculty@university.edu"));
    }

    @Test
    @DisplayName("GET /api/v1/users/{id} - unknown ID returns 404 ProblemDetail")
    void getUserById_whenNotFound_returns404ProblemDetail() throws Exception {
        UUID unknownId = UUID.randomUUID();
        when(userService.getUserById(unknownId))
                .thenThrow(new ResourceNotFoundException("User", unknownId));

        mockMvc.perform(get("/api/v1/users/" + unknownId))
                .andExpect(status().isNotFound())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Resource Not Found"))
                .andExpect(jsonPath("$.status").value(404));
    }
}
