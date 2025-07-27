package com.foodordering.deliveryservice.repository;

import com.foodordering.deliveryservice.entity.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, Long> {
    List<Delivery> findByDriverId(Long driverId);
    List<Delivery> findByOrderId(Long orderId);
    Optional<Delivery> findByOrderIdAndDeliveryStatusNot(Long orderId, String deliveryStatus);
    List<Delivery> findByRestaurantId(Long restaurantId);
    List<Delivery> findByCustomerId(Long customerId);
    List<Delivery> findByDriverIdAndDeliveryStatusIn(Long driverId, List<String> statuses);
    List<Delivery> findByCustomerIdAndDeliveryStatusIn(Long customerId, List<String> statuses);
}
