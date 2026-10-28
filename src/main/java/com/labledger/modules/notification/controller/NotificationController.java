package com.labledger.modules.notification.controller;

import com.labledger.common.dto.ApiResponse;
import com.labledger.modules.inventory.dto.PageResponse;
import com.labledger.modules.notification.dto.NotificationPreferenceResponse;
import com.labledger.modules.notification.dto.NotificationResponse;
import com.labledger.modules.notification.dto.UnreadCountResponse;
import com.labledger.modules.notification.dto.UpdatePreferencesRequest;
import com.labledger.modules.notification.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "In-app notifications and alert preference controls")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Retrieve paginated notifications for current user")
    public ResponseEntity<ApiResponse<PageResponse<NotificationResponse>>> getNotifications(
            @RequestParam(required = false) Boolean unreadOnly,
            @PageableDefault(size = 15) Pageable pageable,
            Authentication authentication
    ) {
        PageResponse<NotificationResponse> response = PageResponse.from(
                notificationService.getNotifications(authentication, unreadOnly, pageable)
        );
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/unread-count")
    @Operation(summary = "Retrieve count of unread notifications for current user")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> getUnreadCount(Authentication authentication) {
        UnreadCountResponse response = notificationService.getUnreadCount(authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/read")
    @Operation(summary = "Mark single notification as read")
    public ResponseEntity<ApiResponse<NotificationResponse>> markAsRead(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        NotificationResponse response = notificationService.markAsRead(id, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/mark-all-read")
    @Operation(summary = "Mark all notifications as read for current user")
    public ResponseEntity<ApiResponse<UnreadCountResponse>> markAllAsRead(Authentication authentication) {
        UnreadCountResponse response = notificationService.markAllAsRead(authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/preferences")
    @Operation(summary = "Get notification channel and reminder preferences for current user")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> getPreferences(Authentication authentication) {
        NotificationPreferenceResponse response = notificationService.getPreferences(authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/preferences")
    @Operation(summary = "Update notification preferences for current user")
    public ResponseEntity<ApiResponse<NotificationPreferenceResponse>> updatePreferences(
            @Valid @RequestBody UpdatePreferencesRequest request,
            Authentication authentication
    ) {
        NotificationPreferenceResponse response = notificationService.updatePreferences(request, authentication);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
