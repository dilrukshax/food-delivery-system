package com.foodordering.orderservice.repository;

import com.foodordering.orderservice.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    @Query("SELECT o FROM Order o WHERE CAST(o.customerId AS string) = :customerId")
    List<Order> findByCustomerId(@Param("customerId") Long customerId);

    @Query("SELECT o FROM Order o WHERE CAST(o.restaurantId AS string) = :restaurantId")
    List<Order> findByRestaurantId(@Param("restaurantId") Long restaurantId);
}

