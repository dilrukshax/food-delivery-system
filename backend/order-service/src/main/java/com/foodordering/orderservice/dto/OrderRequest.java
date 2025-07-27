package com.foodordering.orderservice.dto;

import lombok.Data;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.List;

@Data
public class OrderRequest {
    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
//    private List<OrderItemRequest> orderItems;
    private List<OrderItemRequest> orderItems = new ArrayList<>();
    @NotNull(message = "Delivery address is required")
    private String customerAddressId;
}
