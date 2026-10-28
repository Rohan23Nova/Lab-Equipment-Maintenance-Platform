package com.labledger.modules.auth.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.common.dto.PageResponse;
import com.labledger.modules.auth.dto.CreateUserRequest;
import com.labledger.modules.auth.dto.UpdateUserStatusRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User registration, directory, and controlled account activation/deactivation")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Register a new user account", description = "Validates request payload, encrypts credentials with BCrypt, and establishes user record")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "User account successfully registered"));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user account status (Activate / Suspend)", description = "Restricted exclusively to system administrators")
    public ResponseEntity<ApiResponse<UserResponse>> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request
    ) {
        UserResponse response = userService.updateUserStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.ok(response, "User status updated to " + request.status()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT') or authentication.name == #id.toString()")
    @Operation(summary = "Find user by identifier")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAB_ASSISTANT')")
    @Operation(summary = "List all users with pagination", description = "Restricted to administrators and lab assistants")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<UserResponse> page = PageResponse.from(userService.getAllUsers(pageable));
        return ResponseEntity.ok(ApiResponse.ok(page));
    }
}
