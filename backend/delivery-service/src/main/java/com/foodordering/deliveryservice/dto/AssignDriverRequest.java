package com.foodordering.deliveryservice.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Data
public class AssignDriverRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    @NotNull(message = "Driver ID is required")
    private Long driverId;

    private Long customerId;

    private Long restaurantId;

    private LocalDateTime estimatedDeliveryTime;

    private String deliveryNotes;
}
