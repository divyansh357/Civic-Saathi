package com.civic.modules.auth.repository;

import com.civic.modules.auth.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for AuthToken entity.
 */
@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    Optional<AuthToken> findByToken(String token);
    Optional<AuthToken> findByUserIdAndActiveTrue(String userId);
}
