package com.foodordering.userservice.repository;

import com.foodordering.userservice.entity.AuthToken;
import com.foodordering.userservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AuthTokenRepository extends JpaRepository<AuthToken, Integer> {
    Optional<AuthToken> findByToken(String token);
    List<AuthToken> findByUserAndIsRevokedFalseAndExpiresAtAfter(User user, LocalDateTime now);
    void deleteByUserAndIsRevokedFalse(User user);
}
