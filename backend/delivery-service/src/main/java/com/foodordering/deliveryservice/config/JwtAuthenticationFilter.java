package com.foodordering.deliveryservice.config;

import com.foodordering.deliveryservice.config.UserPrincipal;
import com.foodordering.deliveryservice.util.JwtUtils;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtils jwtUtils;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            final String jwt = authHeader.substring(7);
            final String userEmail = jwtUtils.extractUsername(jwt);

            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // Extract user details from token
                Long userId = jwtUtils.extractUserId(jwt);
                String role = jwtUtils.extractRole(jwt);
                log.debug("Extracted role: {}", role);

                // Create authorities list with both formats of the role
                List<SimpleGrantedAuthority> authorities = new ArrayList<>();

                // Add the role both with and without ROLE_ prefix
                if (role != null) {
                    if (role.startsWith("ROLE_")) {
                        authorities.add(new SimpleGrantedAuthority(role));
                    } else {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role));
                        authorities.add(new SimpleGrantedAuthority(role));
                    }
                }

                // Create user principal
                UserPrincipal userPrincipal = new UserPrincipal(userId, userEmail, role);

                // Set authentication in context
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userPrincipal,
                        null,
                        authorities
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (Exception e) {
            log.error("JWT authentication error: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
