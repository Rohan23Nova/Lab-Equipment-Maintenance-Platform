package com.labledger.modules.auth.repository;

import com.labledger.modules.auth.model.User;
import com.labledger.modules.auth.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r IN :roles AND u.status = 'ACTIVE'")
    List<User> findActiveUsersByRoles(@Param("roles") Collection<UserRole> roles);
}
