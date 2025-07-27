package com.foodordering.notificationservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryAssignedEvent {
    private Long deliveryId;
    private Long orderId;
    private Long driverId;
    private Long customerId;
    private Long restaurantId;
    private LocalDateTime assignedTime;
    private LocalDateTime estimatedDeliveryTime;
}