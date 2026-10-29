package com.labledger.modules.auth.service;

import com.labledger.common.exception.AccountLockedException;
import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.AccountDisabledException;
import com.labledger.modules.auth.dto.CreateUserRequest;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService domain logic")
class UserServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private UserService userService;

    private User activeUser;

    @BeforeEach
    void setUp() {
        activeUser = User.builder()
                .id(UUID.randomUUID())
                .email("alice@lab.edu")
                .firstName("Alice")
                .lastName("Student")
                .department("Physics")
                .roles(Set.of(UserRole.ROLE_STUDENT))
                .status(UserStatus.ACTIVE)
                .passwordHash("$2a$12$hashedpassword")
                .failedLoginAttempts(0)
                .build();
    }

    // ── Registration ──────────────────────────────────────────────────────

    @Test
    @DisplayName("registration fails when email already exists (case-insensitive)")
    void createUser_duplicateEmail_throwsConflict() {
        when(userRepository.existsByEmailIgnoreCase("alice@lab.edu")).thenReturn(true);

        var request = new CreateUserRequest(
                "alice@lab.edu", "Password1!", "Alice", "Test", "Physics", null
        );

        assertThatThrownBy(() -> userService.createUser(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already exists");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("registration defaults to ROLE_STUDENT when no roles supplied")
    void createUser_noRolesSupplied_defaultsToStudent() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("$hashed");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        var request = new CreateUserRequest(
                "bob@lab.edu", "Password1!", "Bob", "Researcher", "Chemistry", null
        );

        var response = userService.createUser(request);

        assertThat(response.roles()).contains(UserRole.ROLE_STUDENT);
    }

    @Test
    @DisplayName("password is BCrypt-encoded, never stored in plain text")
    void createUser_passwordIsEncoded() {
        when(userRepository.existsByEmailIgnoreCase(anyString())).thenReturn(false);
        when(passwordEncoder.encode("RawPass1!")).thenReturn("$2a$12$encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        var request = new CreateUserRequest(
                "carol@lab.edu", "RawPass1!", "Carol", "Prof", "Engineering", null
        );

        userService.createUser(request);

        verify(passwordEncoder).encode("RawPass1!");
        verify(userRepository).save(argThat(u -> u.getPasswordHash().equals("$2a$12$encoded")));
    }

    // ── Authentication ────────────────────────────────────────────────────

    @Test
    @DisplayName("authentication fails for unknown email with generic message (no user enumeration)")
    void authenticateUser_unknownEmail_throwsBadCredentials() {
        when(userRepository.findByEmailIgnoreCase("unknown@lab.edu")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.authenticateUser("unknown@lab.edu", "anyPass"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("authentication fails for wrong password")
    void authenticateUser_wrongPassword_throwsBadCredentials() {
        when(userRepository.findByEmailIgnoreCase("alice@lab.edu")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", activeUser.getPasswordHash())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        assertThatThrownBy(() -> userService.authenticateUser("alice@lab.edu", "wrongPass"))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("account locks after reaching maximum failed login attempts")
    void authenticateUser_maxFailedAttempts_accountLocked() {
        // User already has 4 failed attempts — one more should lock them
        activeUser.setFailedLoginAttempts(4);

        when(userRepository.findByEmailIgnoreCase("alice@lab.edu")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("wrongPass", activeUser.getPasswordHash())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // This 5th attempt should trigger the lockout
        assertThatThrownBy(() -> userService.authenticateUser("alice@lab.edu", "wrongPass"))
                .isInstanceOf(BadCredentialsException.class);

        // The user entity should now be locked (lockoutUntil in the future)
        verify(userRepository).save(argThat(u ->
                u.getLockoutUntil() != null && u.getLockoutUntil().isAfter(Instant.now())
        ));
    }

    @Test
    @DisplayName("locked account cannot authenticate even with correct password")
    void authenticateUser_lockedAccount_throwsAccountLocked() {
        activeUser.setLockoutUntil(Instant.now().plus(15, ChronoUnit.MINUTES));

        when(userRepository.findByEmailIgnoreCase("alice@lab.edu")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> userService.authenticateUser("alice@lab.edu", "correctPass"))
                .isInstanceOf(AccountLockedException.class);

        // Password check must NOT happen when the account is locked
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("disabled account throws AccountDisabledException")
    void authenticateUser_disabledAccount_throwsAccountDisabled() {
        activeUser.setStatus(UserStatus.SUSPENDED);
        // No active lockout
        activeUser.setLockoutUntil(null);

        when(userRepository.findByEmailIgnoreCase("alice@lab.edu")).thenReturn(Optional.of(activeUser));

        assertThatThrownBy(() -> userService.authenticateUser("alice@lab.edu", "correctPass"))
                .isInstanceOf(AccountDisabledException.class);
    }

    @Test
    @DisplayName("successful authentication resets failed login counter")
    void authenticateUser_success_resetsFailedAttempts() {
        activeUser.setFailedLoginAttempts(3);

        when(userRepository.findByEmailIgnoreCase("alice@lab.edu")).thenReturn(Optional.of(activeUser));
        when(passwordEncoder.matches("correctPass", activeUser.getPasswordHash())).thenReturn(true);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        User result = userService.authenticateUser("alice@lab.edu", "correctPass");

        assertThat(result.getFailedLoginAttempts()).isZero();
        assertThat(result.getLockoutUntil()).isNull();
    }
}
