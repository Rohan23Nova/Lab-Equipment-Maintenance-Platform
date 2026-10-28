package com.labledger.modules.auth.service;

import com.labledger.common.exception.ConflictException;
import com.labledger.common.exception.ResourceNotFoundException;
import com.labledger.modules.auth.dto.CreateUserRequest;
import com.labledger.modules.auth.dto.UserResponse;
import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("User with email '" + request.email() + "' already exists");
        }

        User user = User.builder()
                .email(request.email().toLowerCase().trim())
                .passwordHash(passwordEncoder.encode(request.password()))
                .firstName(request.firstName().trim())
                .lastName(request.lastName().trim())
                .department(request.department().trim())
                .roles(request.roles())
                .status(UserStatus.ACTIVE)
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    public UserResponse getUserById(UUID id) {
        return userRepository.findById(id)
                .map(UserResponse::fromEntity)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
    }

    public Page<UserResponse> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable)
                .map(UserResponse::fromEntity);
    }
}
