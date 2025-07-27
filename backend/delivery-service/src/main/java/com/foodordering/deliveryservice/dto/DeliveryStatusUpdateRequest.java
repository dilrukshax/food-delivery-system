package com.foodordering.deliveryservice.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class DeliveryStatusUpdateRequest {
    @NotBlank(message = "Delivery status is required")
    private String deliveryStatus;

    private String currentLocation;
}
