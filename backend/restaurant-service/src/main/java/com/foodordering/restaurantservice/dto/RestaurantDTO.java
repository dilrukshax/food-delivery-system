package com.foodordering.restaurantservice.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RestaurantDTO {
    private Long id;
    private String name;
    private Long ownerId;
    private String address;
    private String phone;
    private boolean isActive;
    private LocalDateTime createdAt;
    private List<String> imageUrls = new ArrayList<>();
    private List<MenuItemDTO> menuItems;
    private Double latitude;
    private Double longitude;
}
