package com.labledger.modules.auth.service;

import com.labledger.common.exception.AccountDisabledException;
import com.labledger.common.exception.AccountLockedException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.dto.CreateUserRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.event.UserStatusChangedEvent;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCKOUT_DURATION_MINUTES = 15;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("User with email '" + request.email() + "' already exists");
        }

        Set<UserRole> roles = (request.roles() != null && !request.roles().isEmpty())
                ? request.roles()
                : Set.of(UserRole.ROLE_STUDENT);

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .department(request.department().trim())
                .roles(roles)
                .status(UserStatus.ACTIVE)
                .failedLoginAttempts(0)
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public User authenticateUser(String email, String rawPassword) {
        User user = userRepository.findByEmailIgnoreCase(email.toLowerCase().trim())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        // Check if account is locked due to prior failed attempts
        if (user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(Instant.now())) {
            throw new AccountLockedException(
                    "Account is temporarily locked due to consecutive failed login attempts. Retry after " + user.getLockoutUntil()
            );
        }

        // Check account status
        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccountDisabledException(
                    "Your user account is currently " + user.getStatus() + ". Access to laboratory systems is disabled."
            );
        }

        // Verify password
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            int newAttempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(newAttempts);

            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                user.setLockoutUntil(Instant.now().plus(LOCKOUT_DURATION_MINUTES, ChronoUnit.MINUTES));
            }

            userRepository.save(user);
            throw new BadCredentialsException("Invalid email or password");
        }

        // Reset failed login attempts on successful login
        if (user.getFailedLoginAttempts() > 0 || user.getLockoutUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userRepository.save(user);
        }

        return user;
    }

    @Transactional
    public UserResponse updateUserStatus(UUID id, UserStatus newStatus) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));

        UserStatus previousStatus = user.getStatus();
        user.setStatus(newStatus);
        if (newStatus == UserStatus.ACTIVE) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
        }

        User updated = userRepository.save(user);
        eventPublisher.publishEvent(new UserStatusChangedEvent(
                updated.getId(),
                updated.getEmail(),
                updated.getFirstName() + " " + updated.getLastName(),
                previousStatus,
                newStatus,
                null,
                "Administrator"
        ));
        return UserResponse.fromEntity(updated);
    }

    public UserResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public UserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new BadCredentialsException("No authenticated laboratory session found");
        }

        String email = authentication.getName();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found in directory: " + email));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new AccountDisabledException("Your account is currently " + user.getStatus());
        }

        return UserResponse.fromEntity(user);
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserResponse::fromEntity);
    }
}
