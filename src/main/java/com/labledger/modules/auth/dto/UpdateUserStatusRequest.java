package com.labledger.modules.auth.dto;

import com.labledger.modules.auth.model.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "User status is required")
        UserStatus status
) {
}
