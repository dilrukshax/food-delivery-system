package com.foodordering.orderservice.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class OrderStatusUpdateRequest {
    @NotBlank(message = "Order status is required")
    private String orderStatus;
}
