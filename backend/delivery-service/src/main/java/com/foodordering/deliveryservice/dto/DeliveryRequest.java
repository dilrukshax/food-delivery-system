package com.foodordering.deliveryservice.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class DeliveryRequest {
    @NotNull(message = "Order ID is required")
    private Long orderId;

    private Long driverId;

    private String currentLocation;
}
