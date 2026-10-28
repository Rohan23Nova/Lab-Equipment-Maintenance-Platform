package com.labledger.modules.auth.event;

import com.labledger.modules.auth.model.UserStatus;

import java.util.UUID;

public record UserStatusChangedEvent(
        UUID userId,
        String email,
        String fullName,
        UserStatus previousStatus,
        UserStatus newStatus,
        UUID actorId,
        String actorName
) {}
