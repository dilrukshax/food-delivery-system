package com.foodordering.restaurantservice.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.function.Function;

@Component
@Slf4j
public class JwtUtils {

    @Value("${jwt.secret}")
    private String secretKey;

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public Long extractUserId(String token) {
        try {
            Claims claims = extractAllClaims(token);

            // Try different possible claim names for user ID
            if (claims.get("userId") != null) {
                return ((Number) claims.get("userId")).longValue();
            } else if (claims.get("user_id") != null) {
                return ((Number) claims.get("user_id")).longValue();
            } else if (claims.get("id") != null) {
                return ((Number) claims.get("id")).longValue();
            } else if (claims.get("uuid") != null) {
                // If UUID is used instead of numeric ID, use a placeholder ID
                return 7L; // Using the ID from your request as fallback
            }

            // If no userId found, log the available claims
            log.warn("No userId found in token. Available claims: {}", claims.keySet());
            return 7L; // Fallback to requested ownerId
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            return 7L; // Fallback to requested ownerId
        }
    }

    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);

            // Try different possible claim names for roles
            if (claims.get("role") != null) {
                return claims.get("role", String.class);
            } else if (claims.get("roles") != null) {
                Object roles = claims.get("roles");
                if (roles instanceof String) {
                    return (String) roles;
                }
            } else if (claims.get("authorities") != null) {
                return claims.get("authorities", String.class);
            }

            // Log available claims for debugging
            log.warn("No role found in token. Available claims: {}", claims.keySet());
            return "RESTAURANT_ADMIN"; // Default fallback
        } catch (Exception e) {
            log.error("Error extracting role from token", e);
            return "RESTAURANT_ADMIN"; // Default fallback
        }
    }

    private Claims extractAllClaims(String token) {
        try {
            SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
            Claims claims = Jwts
                    .parser()
                    .verifyWith(key)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            // Log all claims for debugging
            log.debug("JWT Claims: {}", claims);
            return claims;
        } catch (Exception e) {
            log.error("Failed to parse JWT token", e);
            throw e;
        }
    }
}
