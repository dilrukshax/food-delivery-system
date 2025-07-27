package com.foodordering.userservice.repository;

import com.foodordering.userservice.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUuid(String uuid);
    boolean existsByEmail(String email);
    Page<User> findByRole(String role, Pageable pageable);
}
