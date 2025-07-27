package com.foodordering.userservice.service;

import com.foodordering.userservice.dto.AuthRequest;
import com.foodordering.userservice.dto.AuthResponse;
import com.foodordering.userservice.dto.RegisterRequest;
import com.foodordering.userservice.entity.AuthToken;
import com.foodordering.userservice.entity.User;
import com.foodordering.userservice.repository.AuthTokenRepository;
import com.foodordering.userservice.repository.UserRepository;
import com.foodordering.userservice.util.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Set default role if not provided
        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "CUSTOMER"; // Default role
        } else {
            // Validate role
            if (!role.equals("CUSTOMER") && !role.equals("RESTAURANT_ADMIN") &&
                    !role.equals("DELIVERY_DRIVER") && !role.equals("SYSTEM_ADMIN")) {
                throw new RuntimeException("Invalid role specified");
            }
        }

        // Create user
        User user = User.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .city(request.getCity())
                .role(role)
                .isActive(true)
                .build();

        userRepository.save(user);
        log.debug("User registered successfully: {}", user.getEmail());

        // In AuthService.register(...) and login(...)
        Map<String, Object> extras = Map.of(
                "userId", user.getId(),
                "role", user.getRole()
        );

        String accessToken = jwtUtils.generateToken(extras, user);
        String refreshToken = jwtUtils.generateRefreshToken(user);


        // Save refresh token
        saveUserToken(user, refreshToken);

        return AuthResponse.builder()
                .uuid(user.getUuid())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenExpiration(jwtUtils.getExpirationDateFromToken(accessToken))
                .build();
    }

    @Transactional // Added @Transactional annotation here
    public AuthResponse login(AuthRequest request) {
        log.debug("Attempting login for user: {}", request.getEmail());

        // Authenticate user
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        // Get user from database
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Revoke all existing tokens - this needs transaction context
        revokeAllUserTokens(user);

        // In AuthService.register(...) and login(...)
        Map<String, Object> extras = Map.of(
                "userId", user.getId(),
                "role", user.getRole()
        );

        String accessToken = jwtUtils.generateToken(extras, user);
        String refreshToken = jwtUtils.generateRefreshToken(user);

        // Save new refresh token
        saveUserToken(user, refreshToken);

        log.debug("Login successful for user: {}", user.getEmail());

        return AuthResponse.builder()
                .uuid(user.getUuid())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenExpiration(jwtUtils.getExpirationDateFromToken(accessToken))
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            throw new RuntimeException("Refresh token is required");
        }

        // Find token in database
        AuthToken token = tokenRepository.findByToken(refreshToken)
                .orElseThrow(() -> new RuntimeException("Invalid refresh token"));

        // Check if token is valid
        if (token.isRevoked() || token.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(token);
            throw new RuntimeException("Refresh token expired or revoked");
        }

        // Validate token with JWT utils
        User user = token.getUser();
        if (!jwtUtils.isTokenValid(refreshToken, user)) {
            token.setRevoked(true);
            tokenRepository.save(token);
            throw new RuntimeException("Invalid refresh token");
        }

        // Generate new access token
        String accessToken = jwtUtils.generateToken(user);

        return AuthResponse.builder()
                .uuid(user.getUuid())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .accessToken(accessToken)
                .refreshToken(refreshToken) // Reuse the same refresh token
                .tokenExpiration(jwtUtils.getExpirationDateFromToken(accessToken))
                .build();
    }

    @Transactional
    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isEmpty()) {
            return;
        }

        // Find and revoke token
        tokenRepository.findByToken(refreshToken)
                .ifPresent(token -> {
                    token.setRevoked(true);
                    tokenRepository.save(token);
                });
    }

    private void saveUserToken(User user, String refreshToken) {
        LocalDateTime expiryDate = jwtUtils.getExpirationDateFromToken(refreshToken);

        AuthToken token = AuthToken.builder()
                .user(user)
                .token(refreshToken)
                .expiresAt(expiryDate)
                .isRevoked(false)
                .build();

        tokenRepository.save(token);
    }

    // This method needs to be transactional too
    @Transactional
    protected void revokeAllUserTokens(User user) {
        log.debug("Revoking all tokens for user: {}", user.getEmail());
        tokenRepository.deleteByUserAndIsRevokedFalse(user);
    }
}
