package com.foodordering.orderservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderDTO {
    private Long id;
    private Long customerId;
    private Long restaurantId;
    private String orderStatus;
    private String customerAddressId;
    private LocalDateTime orderDate;
    private BigDecimal totalAmount;
    private List<OrderItemDTO> orderItems = new ArrayList<>();
}
