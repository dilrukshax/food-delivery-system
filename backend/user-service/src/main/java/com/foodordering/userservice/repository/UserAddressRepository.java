package com.foodordering.userservice.repository;

import com.foodordering.userservice.entity.User;
import com.foodordering.userservice.entity.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Integer> {
    List<UserAddress> findByUser(User user);
    Optional<UserAddress> findByUserAndIsDefaultTrue(User user);
}
