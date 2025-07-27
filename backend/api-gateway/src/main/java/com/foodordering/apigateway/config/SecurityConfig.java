package com.foodordering.apigateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.context.NoOpServerSecurityContextRepository;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain springSecurityFilterChain(ServerHttpSecurity http) {
        return http
                // Use stateless sessions
                .securityContextRepository(NoOpServerSecurityContextRepository.getInstance())
                // Disable CSRF for API gateway
                .csrf(csrf -> csrf.disable())
                // Configure authorization
                .authorizeExchange(exchanges -> exchanges
                        // Public endpoints
                        .pathMatchers(
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**",
                                "/webjars/**",
                                "/*/v3/api-docs",
                                "/*/swagger-ui.html",
                                "/*/swagger-ui/**",
                                "/*-service/v3/api-docs"
                        ).permitAll()
                        // Authentication endpoints
                        .pathMatchers("/api/auth/**").permitAll()
                        // Public GET endpoints for restaurant browsing
                        .pathMatchers("/api/restaurants/**").permitAll()
                        // All other endpoints require authentication
                        .anyExchange().permitAll()
                )
                // Disable HTTP Basic and Form Login
                .httpBasic(basic -> basic.disable())
                .formLogin(form -> form.disable())
                .build();
    }
}
