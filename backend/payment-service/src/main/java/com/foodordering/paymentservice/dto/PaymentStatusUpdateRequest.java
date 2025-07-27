package com.foodordering.paymentservice.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class PaymentStatusUpdateRequest {
    @NotBlank(message = "Payment status is required")
    private String paymentStatus;
}
