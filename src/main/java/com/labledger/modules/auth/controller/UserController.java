package com.labledger.modules.auth.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.common.dto.PageResponse;
import com.labledger.modules.auth.dto.CreateUserRequest;
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
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Authentication & Users", description = "User registration, directory, and credential management")
public class UserController {

    private final UserService userService;

    @PostMapping
    @Operation(summary = "Register a new user account", description = "Validates request payload, encrypts credentials with BCrypt, and establishes user record")
    public ResponseEntity<ApiResponse<UserResponse>> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse response = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created(response, "User account successfully registered"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Find user by identifier")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List all users with pagination")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getAllUsers(
            @PageableDefault(size = 20) Pageable pageable
    ) {
        PageResponse<UserResponse> page = PageResponse.from(userService.getAllUsers(pageable));
        return ResponseEntity.ok(ApiResponse.ok(page));
    }
}
