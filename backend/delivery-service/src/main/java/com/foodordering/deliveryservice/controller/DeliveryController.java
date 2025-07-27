package com.foodordering.deliveryservice.controller;

import com.foodordering.deliveryservice.dto.*;
import com.foodordering.deliveryservice.service.AuthenticationService;
import com.foodordering.deliveryservice.service.DeliveryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/deliveries")
public class DeliveryController {

    private final DeliveryService deliveryService;
    private final AuthenticationService authService;

    @Autowired
    public DeliveryController(DeliveryService deliveryService, AuthenticationService authService) {
        this.deliveryService = deliveryService;
        this.authService = authService;
    }

    // Restaurant admin assigns a driver to an order
    @PostMapping("/assign")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'RESTAURANT_ADMIN')")
    public ResponseEntity<DeliveryDTO> assignDriverToOrder(@Valid @RequestBody AssignDriverRequest request) {
        DeliveryDTO delivery = deliveryService.assignDriverToOrder(request);
        return new ResponseEntity<>(delivery, HttpStatus.CREATED);
    }

    // Get all deliveries for a restaurant
    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'RESTAURANT_ADMIN')")
    public ResponseEntity<List<DeliveryDTO>> getDeliveriesByRestaurant(@PathVariable Long restaurantId) {
        List<DeliveryDTO> deliveries = deliveryService.getDeliveriesByRestaurant(restaurantId);
        return ResponseEntity.ok(deliveries);
    }

    // Driver gets their assigned deliveries
    @GetMapping("/driver/assigned")
    @PreAuthorize("hasRole('DELIVERY_DRIVER')")
    public ResponseEntity<List<DeliveryDTO>> getAssignedDeliveries() {
        Long driverId = authService.getCurrentUserId();
        List<DeliveryDTO> deliveries = deliveryService.getAssignedDeliveriesForDriver(driverId);
        return ResponseEntity.ok(deliveries);
    }

    // Driver marks order as picked up
    @PutMapping("/{deliveryId}/pickup")
    @PreAuthorize("hasAnyRole('DELIVERY_DRIVER', 'SYSTEM_ADMIN')")
    public ResponseEntity<DeliveryDTO> markOrderAsPickedUp(
            @PathVariable Long deliveryId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        DeliveryDTO delivery = deliveryService.markOrderAsPickedUp(deliveryId, request);
        return ResponseEntity.ok(delivery);
    }

    // Driver marks order as delivered
    @PutMapping("/{deliveryId}/complete")
    @PreAuthorize("hasAnyRole('DELIVERY_DRIVER', 'SYSTEM_ADMIN')")
    public ResponseEntity<DeliveryDTO> markOrderAsDelivered(
            @PathVariable Long deliveryId,
            @Valid @RequestBody UpdateDeliveryStatusRequest request) {
        DeliveryDTO delivery = deliveryService.markOrderAsDelivered(deliveryId, request);
        return ResponseEntity.ok(delivery);
    }

    //get complete delivery
    @GetMapping("/driver/complete")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'RESTAURANT_ADMIN', 'DELIVERY_DRIVER')")
    public ResponseEntity<List<DeliveryDTO>> getCompletedDeliveries() {
        List<DeliveryDTO> deliveries = deliveryService.getCompletedDeliveries();
        return ResponseEntity.ok(deliveries);
    }

    /**
     * Update the driver's current location with precise coordinates
     */
    @PutMapping("/{deliveryId}/location")
    public ResponseEntity<DeliveryDTO> updateDeliveryLocation(
            @PathVariable Long deliveryId,
            @Valid @RequestBody UpdateLocationRequest request) {
        DeliveryDTO delivery = deliveryService.updateDeliveryLocation(deliveryId, request);
        return ResponseEntity.ok(delivery);
    }

    /**
     * Get the current location of a delivery driver for a specific order
     * Accessible by the customer who placed the order
     */
    @GetMapping("/order/{orderId}/location")
    public ResponseEntity<DeliveryDTO> getDriverLocation(@PathVariable Long orderId) {
        DeliveryDTO delivery = deliveryService.getDriverLocation(orderId);
        return ResponseEntity.ok(delivery);
    }

    // Get delivery by order ID (for customers to track)
    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<DeliveryDTO>> getDeliveryByOrderId(@PathVariable Long orderId) {
        List<DeliveryDTO> deliveries = deliveryService.getDeliveryByOrderId(orderId);
        return ResponseEntity.ok(deliveries);
    }

    // Get active deliveries for customer
    @GetMapping("/customer/active")
    public ResponseEntity<List<DeliveryDTO>> getActiveDeliveriesForCustomer() {
        Long customerId = authService.getCurrentUserId();
        List<DeliveryDTO> deliveries = deliveryService.getActiveDeliveriesForCustomer(customerId);
        return ResponseEntity.ok(deliveries);
    }

    // Cancel delivery
    @PutMapping("/{deliveryId}/cancel")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'RESTAURANT_ADMIN')")
    public ResponseEntity<Void> cancelDelivery(@PathVariable Long deliveryId) {
        deliveryService.cancelDelivery(deliveryId);
        return ResponseEntity.noContent().build();
    }

//    @PutMapping("/{deliveryId}/eta")
//    @PreAuthorize("hasAnyRole('DELIVERY_DRIVER', 'SYSTEM_ADMIN')")
//    public ResponseEntity<DeliveryDTO> updateEstimatedDeliveryTime(
//            @PathVariable Long deliveryId,
//            @Valid @RequestBody UpdateETARequest request) {
//        // Update the estimated delivery time
//        return ResponseEntity.ok(new DeliveryDTO());
//    }

    //get delivery by id
    @GetMapping("/{deliveryId}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'RESTAURANT_ADMIN', 'DELIVERY_DRIVER')")
    public ResponseEntity<DeliveryDTO> getDeliveryById(@PathVariable Long deliveryId) {
        DeliveryDTO delivery = deliveryService.getDeliveryById(deliveryId);
        return ResponseEntity.ok(delivery);
    }

}
