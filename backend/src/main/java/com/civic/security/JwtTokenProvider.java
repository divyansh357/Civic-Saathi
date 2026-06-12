package com.civic.security;

import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Date;

/**
 * JWT Token Provider for token generation and validation.
 */
@Component
public class JwtTokenProvider {

	@Value("${app.jwt.secret:change-this-secret-for-production-min-32-bytes}")
	private String jwtSecret;

	@Value("${app.jwt.access-token-expiration-ms:900000}")
	private long accessTokenExpirationMs;

	@Value("${app.jwt.refresh-token-expiration-ms:604800000}")
	private long refreshTokenExpirationMs;

	private SecretKey signingKey;

	@PostConstruct
	public void init() {
		byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
		if (keyBytes.length < 32) {
			keyBytes = Arrays.copyOf(keyBytes, 32);
		}
		signingKey = Keys.hmacShaKeyFor(keyBytes);
	}

	public String generateAccessToken(String userId, String email, String role) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(accessTokenExpirationMs);

		return Jwts.builder()
				.subject(userId)
				.id(java.util.UUID.randomUUID().toString())
				.claim("email", email)
				.claim("role", role)
				.claim("type", "ACCESS")
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiry))
				.signWith(signingKey)
				.compact();
	}

	public String generateRefreshToken(String userId) {
		Instant now = Instant.now();
		Instant expiry = now.plusMillis(refreshTokenExpirationMs);

		return Jwts.builder()
				.subject(userId)
				.id(java.util.UUID.randomUUID().toString())
				.claim("type", "REFRESH")
				.issuedAt(Date.from(now))
				.expiration(Date.from(expiry))
				.signWith(signingKey)
				.compact();
	}

	public String getUserIdFromToken(String token) {
		return parseClaims(token).getSubject();
	}

	public String getRoleFromToken(String token) {
		Object role = parseClaims(token).get("role");
		return role == null ? "" : String.valueOf(role);
	}

	public boolean validateToken(String token) {
		try {
			parseClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException ex) {
			return false;
		}
	}

	public LocalDateTime getRefreshTokenExpiresAt() {
		return LocalDateTime.now().plus(Duration.ofMillis(refreshTokenExpirationMs));
	}

	public long getAccessTokenExpirySeconds() {
		return Duration.ofMillis(accessTokenExpirationMs).getSeconds();
	}

	private Claims parseClaims(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}
}
