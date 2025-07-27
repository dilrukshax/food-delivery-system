package com.foodordering.restaurantservice.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;

@Data
public class RestaurantRequest {
    @NotBlank(message = "Restaurant name is required")
    private String name;

    private String address;
    private String phone;
    private Double latitude;
    private Double longitude;



    // Owner ID will be automatically set from authenticated user
}
