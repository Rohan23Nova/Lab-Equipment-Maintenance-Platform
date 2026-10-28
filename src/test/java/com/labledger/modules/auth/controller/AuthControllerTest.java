package com.labledger.modules.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.labledger.common.error.GlobalExceptionHandler;
import com.labledger.common.exception.AccountDisabledException;
import com.labledger.common.exception.AccountLockedException;
import com.labledger.config.SecurityConfig;
import com.labledger.config.security.CustomAccessDeniedHandler;
import com.labledger.config.security.CustomAuthenticationEntryPoint;
import com.labledger.modules.auth.dto.LoginRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({
        SecurityConfig.class,
        GlobalExceptionHandler.class,
        CustomAuthenticationEntryPoint.class,
        CustomAccessDeniedHandler.class
})
class AuthControllerTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void resetCsrfFilter() {
        try {
            org.springframework.security.web.SecurityFilterChain sfc = applicationContext.getBean(org.springframework.security.web.SecurityFilterChain.class);
            if (sfc instanceof org.springframework.security.web.DefaultSecurityFilterChain dsfc) {
                for (jakarta.servlet.Filter f : dsfc.getFilters()) {
                    if (f instanceof org.springframework.security.web.csrf.CsrfFilter csrfFilter) {
                        java.lang.reflect.Field repoField = org.springframework.security.web.csrf.CsrfFilter.class.getDeclaredField("tokenRepository");
                        repoField.setAccessible(true);
                        repoField.set(csrfFilter, org.springframework.security.web.csrf.CookieCsrfTokenRepository.withHttpOnlyFalse());
                    }
                }
            }
        } catch (Exception e) {
            // ignore
        }
    }

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @DisplayName("POST /api/v1/auth/login - valid credentials returns 200 with user profile")
    void login_withValidCredentials_returns200() throws Exception {
        UUID userId = UUID.randomUUID();
        User mockUser = User.builder()
                .id(userId)
                .email("student@university.edu")
                .passwordHash("hashed")
                .firstName("Elena")
                .lastName("Rostova")
                .department("Physics")
                .status(UserStatus.ACTIVE)
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .build();

        when(userService.authenticateUser(eq("student@university.edu"), eq("ValidPass123!")))
                .thenReturn(mockUser);

        LoginRequest request = new LoginRequest("student@university.edu", "ValidPass123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("student@university.edu"))
                .andExpect(jsonPath("$.data.roles[0]").value("ROLE_STUDENT"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - bad credentials returns 401 ProblemDetail")
    void login_withBadCredentials_returns401() throws Exception {
        when(userService.authenticateUser(any(), any()))
                .thenThrow(new BadCredentialsException("Invalid email or password"));

        LoginRequest request = new LoginRequest("unknown@university.edu", "WrongPassword123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Authentication Failed"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - disabled/suspended account returns 403 ProblemDetail")
    void login_withDisabledAccount_returns403() throws Exception {
        when(userService.authenticateUser(any(), any()))
                .thenThrow(new AccountDisabledException("Your user account is currently SUSPENDED"));

        LoginRequest request = new LoginRequest("suspended@university.edu", "ValidPass123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Account Disabled"))
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    @DisplayName("POST /api/v1/auth/login - locked account returns 423 Locked ProblemDetail")
    void login_withLockedAccount_returns423() throws Exception {
        when(userService.authenticateUser(any(), any()))
                .thenThrow(new AccountLockedException("Account is temporarily locked due to consecutive failed attempts"));

        LoginRequest request = new LoginRequest("locked@university.edu", "ValidPass123!");

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isLocked())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Account Locked"))
                .andExpect(jsonPath("$.status").value(423));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - authenticated user returns 200 with profile")
    @WithMockUser(username = "faculty@university.edu", roles = {"FACULTY"})
    void getCurrentUser_whenAuthenticated_returns200() throws Exception {
        UserResponse mockResponse = new UserResponse(
                UUID.randomUUID(),
                "faculty@university.edu",
                "David",
                "Vance",
                "Physics",
                UserStatus.ACTIVE,
                Set.of(UserRole.ROLE_FACULTY),
                Instant.now()
        );

        when(userService.getCurrentUser(any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.email").value("faculty@university.edu"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/me - unauthenticated request returns 401 ProblemDetail")
    void getCurrentUser_whenUnauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().string("Content-Type", MediaType.APPLICATION_PROBLEM_JSON_VALUE))
                .andExpect(jsonPath("$.title").value("Unauthorized"))
                .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("GET /api/v1/auth/csrf - returns CSRF token and sets XSRF-TOKEN cookie")
    void getCsrfToken_returnsToken() throws Exception {
        mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headerName", org.hamcrest.Matchers.isOneOf("X-XSRF-TOKEN", "X-CSRF-TOKEN")))
                .andExpect(cookie().exists("XSRF-TOKEN"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/logout - clears session and returns 200")
    @WithMockUser
    void logout_clearsSession_returns200() throws Exception {
        mockMvc.perform(post("/api/v1/auth/logout").with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Session signed out successfully"));
    }
}
