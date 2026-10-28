package com.labledger.modules.auth.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.auth.dto.CsrfTokenResponse;
import com.labledger.modules.auth.dto.LoginRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Session login, logout, current user inspection, and CSRF token handshake")
public class AuthController {

    private final UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user and establish stateful HTTP session")
    public ResponseEntity<ApiResponse<UserResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest
    ) {
        User user = userService.authenticateUser(request.email(), request.password());

        List<SimpleGrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.name()))
                .toList();

        UsernamePasswordAuthenticationToken authToken =
                new UsernamePasswordAuthenticationToken(user.getEmail(), null, authorities);

        SecurityContext securityContext = SecurityContextHolder.createEmptyContext();
        securityContext.setAuthentication(authToken);
        SecurityContextHolder.setContext(securityContext);

        HttpSession session = httpRequest.getSession(true);
        session.setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, securityContext);

        return ResponseEntity.ok(ApiResponse.ok(UserResponse.fromEntity(user), "Authentication successful"));
    }

    @PostMapping("/logout")
    @Operation(summary = "Invalidate user session and purge security context")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        if (authentication != null) {
            new SecurityContextLogoutHandler().logout(request, response, authentication);
        } else {
            HttpSession session = request.getSession(false);
            if (session != null) {
                session.invalidate();
            }
            SecurityContextHolder.clearContext();
        }
        return ResponseEntity.ok(ApiResponse.ok(null, "Session signed out successfully"));
    }

    @GetMapping("/me")
    @Operation(summary = "Inspect current authenticated user profile")
    public ResponseEntity<ApiResponse<UserResponse>> getCurrentUser(Authentication authentication) {
        UserResponse response = userService.getCurrentUser(authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/csrf")
    @Operation(summary = "Obtain CSRF token and populate XSRF-TOKEN cookie for client-side mutations")
    public ResponseEntity<ApiResponse<CsrfTokenResponse>> getCsrfToken(CsrfToken csrfToken) {
        CsrfTokenResponse response = new CsrfTokenResponse(
                csrfToken.getToken(),
                csrfToken.getHeaderName(),
                csrfToken.getParameterName()
        );
        return ResponseEntity.ok(ApiResponse.ok(response, "CSRF token initialized"));
    }
}
