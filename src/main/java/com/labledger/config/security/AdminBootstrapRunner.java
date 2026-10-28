package com.labledger.config.security;

import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import com.labledger.modules.auth.model.UserStatus;
import com.labledger.modules.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean hasAdmin = userRepository.findAll().stream()
                .anyMatch(user -> user.getRoles().contains(UserRole.ROLE_ADMIN));

        if (hasAdmin) {
            log.info("Administrator account verified in laboratory directory.");
            return;
        }

        String email = environment.getProperty("INITIAL_ADMIN_EMAIL");
        String rawPassword = environment.getProperty("INITIAL_ADMIN_PASSWORD");

        if (StringUtils.hasText(email) && StringUtils.hasText(rawPassword)) {
            User admin = User.builder()
                    .email(email.toLowerCase().trim())
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .firstName("System")
                    .lastName("Administrator")
                    .department("Laboratory Administration")
                    .status(UserStatus.ACTIVE)
                    .roles(Set.of(UserRole.ROLE_ADMIN, UserRole.ROLE_LAB_ASSISTANT))
                    .failedLoginAttempts(0)
                    .build();

            userRepository.save(admin);
            log.info("Bootstrapped initial laboratory administrator: [{}]", email);
        } else {
            log.warn("No administrator account found. Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD to bootstrap one.");
        }
    }
}
