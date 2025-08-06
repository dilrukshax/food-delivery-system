package com.foodordering.apigateway.filter;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;
import java.util.List;

@Component
public class JwtGatewayGatewayFilterFactory extends AbstractGatewayFilterFactory<JwtGatewayGatewayFilterFactory.Config> {

    @Value("${jwt.secret}")
    private String secretKey;

    private final List<String> excludedUrls = List.of(
            "/api/auth/login",
            "/api/auth/register",
            "/swagger-ui.html",
            "/swagger-ui/",
            "/v3/api-docs"
    );

    public JwtGatewayGatewayFilterFactory() {
        super(Config.class);
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();

            // Skip JWT validation for excluded paths
            if (isExcludedPath(request)) {
                return chain.filter(exchange);
            }

            // Check for Authorization header
            if (!request.getHeaders().containsKey(HttpHeaders.AUTHORIZATION)) {
                return onError(exchange, "No Authorization header", HttpStatus.UNAUTHORIZED);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return onError(exchange, "Invalid Authorization header format", HttpStatus.UNAUTHORIZED);
            }

            String token = authHeader.substring(7);
            try {
                // Validate the token
                validateToken(token);

                // Token is valid, proceed with the request
                return chain.filter(exchange);
            } catch (Exception e) {
                return onError(exchange, "Invalid token: " + e.getMessage(), HttpStatus.UNAUTHORIZED);
            }
        };
    }

    private Mono<Void> onError(ServerWebExchange exchange, String error, HttpStatus httpStatus) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(httpStatus);
        return response.setComplete();
    }

    private boolean isExcludedPath(ServerHttpRequest request) {
        String path = request.getURI().getPath();
        return excludedUrls.stream().anyMatch(path::startsWith) ||
                path.matches(".*/v3/api-docs.*") ||
                path.matches(".*/swagger-ui.*");
    }

    private Claims validateToken(String token) {
        SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
        // PARSE via parser(), not parserBuilder()
        return Jwts.parser()                     // <— returns JwtParserBuilder
                .setSigningKey(key)           // set your HMAC key
                .build()                      // build the JwtParser
                .parseClaimsJws(token)        // parse and verify
                .getBody();
    }


    public static class Config {
        // Configuration properties if needed
    }
}

