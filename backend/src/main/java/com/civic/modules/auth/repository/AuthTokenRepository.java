package com.civic.modules.auth.repository;

import com.civic.modules.auth.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for AuthToken entity.
 * PK type is UUID to match the PostgreSQL uuid column type.
 */
@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, UUID> {
    Optional<AuthToken> findByToken(String token);
    Optional<AuthToken> findByTokenAndActiveTrue(String token);

    @Query("SELECT t FROM AuthToken t WHERE t.user.id = :userId AND t.active = true")
    Optional<AuthToken> findByUserIdAndActiveTrue(@Param("userId") UUID userId);

    @Query("SELECT t FROM AuthToken t WHERE t.user.id = :userId AND t.tokenType = :tokenType AND t.active = true")
    List<AuthToken> findAllByUserIdAndTokenTypeAndActiveTrue(
            @Param("userId") UUID userId,
            @Param("tokenType") String tokenType);
}
