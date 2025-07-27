package com.foodordering.notificationservice.util;

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
            }

            log.warn("No userId found in token. Available claims: {}", claims.keySet());
            return null;
        } catch (Exception e) {
            log.error("Error extracting userId from token", e);
            return null;
        }
    }

    public String extractRole(String token) {
        try {
            Claims claims = extractAllClaims(token);

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

            log.warn("No role found in token. Available claims: {}", claims.keySet());
            return null;
        } catch (Exception e) {
            log.error("Error extracting role from token", e);
            return null;
        }
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
