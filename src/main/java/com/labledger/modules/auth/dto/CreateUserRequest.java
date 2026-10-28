package com.labledger.modules.auth.dto;

import com.labledger.modules.auth.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record CreateUserRequest(
        @NotBlank(message = "Email must not be blank")
        @Email(message = "Must be a valid email address")
        String email,

        @NotBlank(message = "Password must not be blank")
        @Size(min = 10, max = 128, message = "Password must be between 10 and 128 characters")
        String password,

        @NotBlank(message = "First name must not be blank")
        @Size(max = 100, message = "First name must not exceed 100 characters")
        String firstName,

        @NotBlank(message = "Last name must not be blank")
        @Size(max = 100, message = "Last name must not exceed 100 characters")
        String lastName,

        @NotBlank(message = "Department must not be blank")
        @Size(max = 150, message = "Department must not exceed 150 characters")
        String department,

        @NotNull(message = "At least one role must be assigned")
        Set<UserRole> roles
) {
}
