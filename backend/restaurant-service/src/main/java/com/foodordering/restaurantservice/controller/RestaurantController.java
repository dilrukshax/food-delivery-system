package com.foodordering.restaurantservice.controller;

import com.foodordering.restaurantservice.dto.MenuItemDTO;
import com.foodordering.restaurantservice.dto.MenuItemRequest;
import com.foodordering.restaurantservice.dto.RestaurantDTO;
import com.foodordering.restaurantservice.dto.RestaurantRequest;
import com.foodordering.restaurantservice.service.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;


import javax.validation.Valid;
import java.io.IOException;
import java.util.List;

@Tag(name = "Orders", description = "Order management endpoints")
@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    private final RestaurantService restaurantService;

    @Autowired
    public RestaurantController(RestaurantService restaurantService) {
        this.restaurantService = restaurantService;
    }

    // Restaurant endpoints

    @GetMapping
    public ResponseEntity<List<RestaurantDTO>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantService.getAllRestaurants());
    }

    @GetMapping("/{restaurantId}")
    public ResponseEntity<RestaurantDTO> getRestaurantById(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantService.getRestaurantById(restaurantId));
    }

    @Operation(
            summary = "Create a new order",
            description = "Creates a new food order for the authenticated customer",
            responses = {
                    @ApiResponse(responseCode = "201", description = "Order created successfully"),
                    @ApiResponse(responseCode = "400", description = "Invalid input data"),
                    @ApiResponse(responseCode = "401", description = "Not authenticated")
            }
    )
    @Parameter(
            name = "request",
            description = "Order request object containing order details",
            required = true,
            content = @Content(schema = @Schema(implementation = RestaurantRequest.class))
    )
    @PostMapping
    @PreAuthorize("hasRole('RESTAURANT_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<RestaurantDTO> createRestaurant(@Valid @RequestBody RestaurantRequest request) {
        RestaurantDTO createdRestaurant = restaurantService.createRestaurant(request);
        return new ResponseEntity<>(createdRestaurant, HttpStatus.CREATED);
    }

    //get restaurant by ownerId get the ownerId from the JWT token
    @GetMapping("/owner")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<RestaurantDTO>> getRestaurantsByOwnerId() {
        return ResponseEntity.ok(restaurantService.getRestaurantsByOwnerId());
    }


    @PutMapping("/{restaurantId}")
    public ResponseEntity<RestaurantDTO> updateRestaurant(
            @PathVariable Long restaurantId,
            @Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.ok(restaurantService.updateRestaurant(restaurantId, request));
    }


    @DeleteMapping("/{restaurantId}")
    public ResponseEntity<Void> deleteRestaurant(@PathVariable Long restaurantId) {
        restaurantService.deleteRestaurant(restaurantId);
        return ResponseEntity.noContent().build();
    }

    // Menu Item endpoints

    @GetMapping("/{restaurantId}/menu-items")
    public ResponseEntity<List<MenuItemDTO>> getMenuItemsByRestaurantId(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantService.getMenuItemsByRestaurantId(restaurantId));
    }

    @GetMapping("/{restaurantId}/menu-items/{menuItemId}")
    public ResponseEntity<MenuItemDTO> getMenuItemById(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId) {
        return ResponseEntity.ok(restaurantService.getMenuItemById(restaurantId, menuItemId));
    }

    @PostMapping("/{restaurantId}/menu-items")
    public ResponseEntity<MenuItemDTO> createMenuItem(
            @PathVariable Long restaurantId,
            @Valid @RequestBody MenuItemRequest request) {
        MenuItemDTO createdMenuItem = restaurantService.createMenuItem(restaurantId, request);
        return new ResponseEntity<>(createdMenuItem, HttpStatus.CREATED);
    }

    @PutMapping("/{restaurantId}/menu-items/{menuItemId}")
    public ResponseEntity<MenuItemDTO> updateMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId,
            @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(restaurantService.updateMenuItem(restaurantId, menuItemId, request));
    }

    @DeleteMapping("/{restaurantId}/menu-items/{menuItemId}")
    public ResponseEntity<Void> deleteMenuItem(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId) {
        restaurantService.deleteMenuItem(restaurantId, menuItemId);
        return ResponseEntity.noContent().build();
    }

    // Restaurant image endpoints
    @PostMapping(value = "/{restaurantId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<RestaurantDTO> uploadRestaurantImage(
            @PathVariable Long restaurantId,
            @RequestParam("file") MultipartFile file) throws IOException {
        RestaurantDTO updatedRestaurant = restaurantService.addRestaurantImage(restaurantId, file);
        return ResponseEntity.ok(updatedRestaurant);
    }



    // Menu item image endpoints
    @PostMapping(value = "/{restaurantId}/menu-items/{menuItemId}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<MenuItemDTO> uploadMenuItemImage(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId,
            @RequestParam("file") MultipartFile file) throws IOException {
        MenuItemDTO updatedMenuItem = restaurantService.addMenuItemImage(restaurantId, menuItemId, file);
        return ResponseEntity.ok(updatedMenuItem);
    }

//    @DeleteMapping("/{restaurantId}/menu-items/{menuItemId}/images")
//    public ResponseEntity<MenuItemDTO> deleteMenuItemImage(
//            @PathVariable Long restaurantId,
//            @PathVariable Long menuItemId,
//            @RequestParam String imageUrl) {
//        MenuItemDTO updatedMenuItem = restaurantService.removeMenuItemImage(restaurantId, menuItemId, imageUrl);
//        return ResponseEntity.ok(updatedMenuItem);
//    }

    //delete menuItem images
    @DeleteMapping("/{restaurantId}/menu-items/{menuItemId}/images/{imageUrl}")
    public ResponseEntity<MenuItemDTO> deleteMenuItemImage(
            @PathVariable Long restaurantId,
            @PathVariable Long menuItemId,
            @PathVariable String imageUrl) {
        MenuItemDTO updatedMenuItem = restaurantService.removeMenuItemImage(restaurantId, menuItemId, imageUrl);
        return ResponseEntity.ok(updatedMenuItem);
    }

    //delete restaurant images
    @DeleteMapping("/{restaurantId}/images/{imageUrl}")
    public ResponseEntity<RestaurantDTO> deleteRestaurantImage(
            @PathVariable Long restaurantId,
            @PathVariable String imageUrl) {
        RestaurantDTO updatedRestaurant = restaurantService.removeRestaurantImage(restaurantId, imageUrl);
        return ResponseEntity.ok(updatedRestaurant);
    }
}
