package com.civic.modules.auth.repository;

import com.civic.modules.auth.entity.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for AuthToken entity.
 */
@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, String> {
    Optional<AuthToken> findByToken(String token);
    Optional<AuthToken> findByTokenAndActiveTrue(String token);
    
    @Query("SELECT t FROM AuthToken t WHERE t.user.id = :userId AND t.active = true")
    Optional<AuthToken> findByUserIdAndActiveTrue(@Param("userId") String userId);
    
    @Query("SELECT t FROM AuthToken t WHERE t.user.id = :userId AND t.tokenType = :tokenType AND t.active = true")
    List<AuthToken> findAllByUserIdAndTokenTypeAndActiveTrue(@Param("userId") String userId, @Param("tokenType") String tokenType);
}
