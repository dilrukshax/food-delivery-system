package com.foodordering.deliveryservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDTO {
    private Long id;
    private Long orderId;
    private Long driverId;
    private Long customerId;
    private Long restaurantId;
    private LocalDateTime pickupTime;
    private LocalDateTime deliveryTime;
    private LocalDateTime assignedTime;
    private LocalDateTime estimatedDeliveryTime;
    private String deliveryStatus;
    private String currentLocation;
    private String deliveryNotes;
    private String driverName; // Added for UI convenience
    // Location data
    private Double latitude;
    private Double longitude;
}
