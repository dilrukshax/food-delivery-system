package com.foodordering.apigateway.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Component
@Slf4j
public class JwtUtil {

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

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public boolean isTokenExpired(String token) {
        try {
            return extractExpiration(token).before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    public boolean validateToken(String token) {
        try {
            extractAllClaims(token);
            return !isTokenExpired(token);
        } catch (SignatureException e) {
            log.error("Invalid JWT signature: {}", e.getMessage());
        } catch (MalformedJwtException e) {
            log.error("Invalid JWT token: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token is expired: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims string is empty: {}", e.getMessage());
        } catch (Exception e) {
            log.error("JWT validation error: {}", e.getMessage());
        }
        return false;
    }

    private Claims extractAllClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
        return Jwts.parser()                     // <— returns JwtParserBuilder
                .setSigningKey(key)           // set your HMAC key
                .build()                      // build the JwtParser
                .parseClaimsJws(token)        // parse and verify
                .getBody();
    }
}
