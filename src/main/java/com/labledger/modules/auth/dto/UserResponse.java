package com.labledger.modules.auth.dto;

import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record UserResponse(
        UUID id,
        String email,
        String firstName,
        String lastName,
        String department,
        UserStatus status,
        Set<UserRole> roles,
        Instant createdAt
) {
    public static UserResponse fromEntity(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getDepartment(),
                user.getStatus(),
                user.getRoles(),
                user.getCreatedAt()
        );
    }
}
