package com.foodordering.notificationservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderStatusChangedEvent {
    private Long orderId;
    private Long customerId;
    private Long restaurantId;
    private String previousStatus;
    private String newStatus;
    private LocalDateTime updatedAt;
}
