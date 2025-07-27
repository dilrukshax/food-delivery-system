package com.foodordering.deliveryservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "deliveries")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Delivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "delivery_id")
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "driver_id")
    private Long driverId;

    @Column(name = "pickup_time")
    private LocalDateTime pickupTime;

    @Column(name = "delivery_time")
    private LocalDateTime deliveryTime;

    @Column(name = "delivery_status", nullable = false)
    private String deliveryStatus;

    @Column(name = "current_location")
    private String currentLocation;

    @Column(name = "assigned_time")
    private LocalDateTime assignedTime;

    @Column(name = "estimated_delivery_time")
    private LocalDateTime estimatedDeliveryTime;

    @Column(name = "delivery_notes")
    private String deliveryNotes;

    @Column(name = "customer_id")
    private Long customerId;

    @Column(name = "restaurant_id")
    private Long restaurantId;

    // Add precise latitude and longitude fields
    @Column(precision = 10)
    private Double latitude;

    @Column(precision = 10)
    private Double longitude;
}
