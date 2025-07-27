package com.foodordering.notificationservice.dto.event;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderCreatedEvent {
    private Long orderId;
    private Long customerId;
    private Long restaurantId;
    private String orderStatus;
    private Double totalAmount;
    private LocalDateTime createdAt;
}


