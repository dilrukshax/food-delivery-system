package com.foodordering.deliveryservice.service;

import com.foodordering.deliveryservice.dto.*;
import com.foodordering.deliveryservice.entity.Delivery;
import com.foodordering.deliveryservice.exception.DeliveryAccessDeniedException;
import com.foodordering.deliveryservice.exception.ResourceNotFoundException;
import com.foodordering.deliveryservice.repository.DeliveryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final AuthenticationService authService;

    @Autowired
    public DeliveryService(
            DeliveryRepository deliveryRepository,
            AuthenticationService authService) {
        this.deliveryRepository = deliveryRepository;
        this.authService = authService;
    }

    // Restaurant admin assigns driver to an order
    @Transactional
    public DeliveryDTO assignDriverToOrder(AssignDriverRequest request) {
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            throw new DeliveryAccessDeniedException("Only restaurant admins can assign drivers");
        }

        // Check if delivery for this order already exists
        deliveryRepository.findByOrderIdAndDeliveryStatusNot(request.getOrderId(), "CANCELLED")
                .ifPresent(delivery -> {
                    if (!"CANCELLED".equals(delivery.getDeliveryStatus())) {
                        throw new IllegalStateException("Delivery for this order already exists with status: "
                                + delivery.getDeliveryStatus());
                    }
                });

        // Create new delivery assignment
        Delivery delivery = new Delivery();
        delivery.setOrderId(request.getOrderId());
        delivery.setDriverId(request.getDriverId());
        delivery.setCustomerId(request.getCustomerId());
        delivery.setRestaurantId(request.getRestaurantId());
        delivery.setDeliveryStatus("ASSIGNED");
        delivery.setAssignedTime(LocalDateTime.now());
        delivery.setEstimatedDeliveryTime(request.getEstimatedDeliveryTime());
        delivery.setDeliveryNotes(request.getDeliveryNotes());

        Delivery savedDelivery = deliveryRepository.save(delivery);

        // TODO: Add integration with notification service to alert driver
        log.info("Driver {} assigned to order {}", request.getDriverId(), request.getOrderId());

        return convertToDeliveryDTO(savedDelivery);
    }

    // Get all deliveries for a restaurant
    public List<DeliveryDTO> getDeliveriesByRestaurant(Long restaurantId) {
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            throw new DeliveryAccessDeniedException("Only restaurant admins can view restaurant deliveries");
        }

        return deliveryRepository.findByRestaurantId(restaurantId).stream()
                .map(this::convertToDeliveryDTO)
                .collect(Collectors.toList());
    }

    // Get assigned deliveries for a driver
    public List<DeliveryDTO> getAssignedDeliveriesForDriver(Long driverId) {
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                "RESTAURANT_ADMIN".equals(currentUserRole) ||
                (driverId.equals(currentUserId) && "DELIVERY_DRIVER".equals(currentUserRole)))) {
            throw new DeliveryAccessDeniedException("You can only view your own deliveries");
        }

        List<String> activeStatuses = Arrays.asList("ASSIGNED", "PICKED_UP");

        return deliveryRepository.findByDriverIdAndDeliveryStatusIn(driverId, activeStatuses).stream()
                .map(this::convertToDeliveryDTO)
                .collect(Collectors.toList());
    }

    //get delivery by id
    @Transactional
    public DeliveryDTO getDeliveryById(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        // Check if the user is authorized to view this delivery
        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                "RESTAURANT_ADMIN".equals(currentUserRole) ||
                delivery.getCustomerId().equals(currentUserId) ||
                (delivery.getDriverId() != null && delivery.getDriverId().equals(currentUserId) && "DELIVERY_DRIVER".equals(currentUserRole)))) {
            throw new DeliveryAccessDeniedException("You are not authorized to view this delivery");
        }

        return convertToDeliveryDTO(delivery);
    }

    // Driver marks order as picked up
    @Transactional
    public DeliveryDTO markOrderAsPickedUp(Long deliveryId, UpdateDeliveryStatusRequest request) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        // Only the assigned driver or admin can update
        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                (delivery.getDriverId() != null && delivery.getDriverId().equals(currentUserId) && "DELIVERY_DRIVER".equals(currentUserRole)))) {
            throw new DeliveryAccessDeniedException("Only the assigned driver can update this delivery");
        }

        // Verify current status is ASSIGNED
        if (!"ASSIGNED".equals(delivery.getDeliveryStatus())) {
            throw new IllegalStateException("Delivery must be in ASSIGNED status to be picked up. Current status: "
                    + delivery.getDeliveryStatus());
        }

        delivery.setDeliveryStatus("PICKED_UP");
        delivery.setPickupTime(LocalDateTime.now());

        if (request.getCurrentLocation() != null) {
            delivery.setCurrentLocation(request.getCurrentLocation());
        }

        if (request.getDeliveryNotes() != null) {
            delivery.setDeliveryNotes(request.getDeliveryNotes());
        }

        Delivery updatedDelivery = deliveryRepository.save(delivery);

        // TODO: Add integration with order service to update order status
        log.info("Order {} marked as picked up by driver {}", delivery.getOrderId(), delivery.getDriverId());

        return convertToDeliveryDTO(updatedDelivery);
    }

    // Driver marks order as delivered
    @Transactional
    public DeliveryDTO markOrderAsDelivered(Long deliveryId, UpdateDeliveryStatusRequest request) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        // Only the assigned driver or admin can update
        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                (delivery.getDriverId() != null && delivery.getDriverId().equals(currentUserId) && "DELIVERY_DRIVER".equals(currentUserRole)))) {
            throw new DeliveryAccessDeniedException("Only the assigned driver can update this delivery");
        }

        // Verify current status is PICKED_UP
        if (!"PICKED_UP".equals(delivery.getDeliveryStatus())) {
            throw new IllegalStateException("Delivery must be in PICKED_UP status to be delivered. Current status: "
                    + delivery.getDeliveryStatus());
        }

        delivery.setDeliveryStatus("DELIVERED");
        delivery.setDeliveryTime(LocalDateTime.now());

        if (request.getCurrentLocation() != null) {
            delivery.setCurrentLocation(request.getCurrentLocation());
        }

        Delivery updatedDelivery = deliveryRepository.save(delivery);

        // TODO: Add integration with order service to update order status
        log.info("Order {} marked as delivered by driver {}", delivery.getOrderId(), delivery.getDriverId());

        return convertToDeliveryDTO(updatedDelivery);
    }



    // Get delivery by order ID
    public List<DeliveryDTO> getDeliveryByOrderId(Long orderId) {
        return deliveryRepository.findByOrderId(orderId).stream()
                .map(this::convertToDeliveryDTO)
                .collect(Collectors.toList());
    }

    // Get active deliveries for customer
    public List<DeliveryDTO> getActiveDeliveriesForCustomer(Long customerId) {
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                customerId.equals(currentUserId))) {
            throw new DeliveryAccessDeniedException("You can only view your own deliveries");
        }

        List<String> activeStatuses = Arrays.asList("ASSIGNED", "PICKED_UP");

        return deliveryRepository.findByCustomerIdAndDeliveryStatusIn(customerId, activeStatuses).stream()
                .map(this::convertToDeliveryDTO)
                .collect(Collectors.toList());
    }

    // Cancel delivery
    @Transactional
    public void cancelDelivery(Long deliveryId) {
        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            throw new DeliveryAccessDeniedException("Only admins can cancel deliveries");
        }

        // Cannot cancel completed deliveries
        if ("DELIVERED".equals(delivery.getDeliveryStatus())) {
            throw new IllegalStateException("Cannot cancel a delivery that is already delivered");
        }

        delivery.setDeliveryStatus("CANCELLED");
        deliveryRepository.save(delivery);

        // TODO: Add integration with order service to update order status
        log.info("Delivery for order {} has been cancelled", delivery.getOrderId());
    }

    //get complete delivery
    public List<DeliveryDTO> getCompletedDeliveries() {
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole) ||
                "DELIVERY_DRIVER".equals(currentUserRole))) {
            throw new DeliveryAccessDeniedException("Only admins can view completed deliveries");
        }
        //get driver id
        Long currentUserId = authService.getCurrentUserId();
        List<Delivery> deliveries = deliveryRepository.findByDriverId(currentUserId);
        if (deliveries.isEmpty()) {
            throw new ResourceNotFoundException("No completed deliveries found for driver: " + currentUserId);
        }
        List<DeliveryDTO> completedDeliveries = deliveries.stream()
                .filter(delivery -> "DELIVERED".equals(delivery.getDeliveryStatus()))
                .map(this::convertToDeliveryDTO)
                .collect(Collectors.toList());
        if (completedDeliveries.isEmpty()) {
            throw new ResourceNotFoundException("No completed deliveries found for driver: " + currentUserId);
        } else {
            return completedDeliveries;
        }


    }



    /**
     * Updates the driver's current location with precise coordinates
     */
    public DeliveryDTO updateDeliveryLocation(Long deliveryId, UpdateLocationRequest request) {
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        Delivery delivery = deliveryRepository.findById(deliveryId)
                .orElseThrow(() -> new ResourceNotFoundException("Delivery not found with id: " + deliveryId));

        if (!authService.isDeliveryDriver(delivery.getDriverId())) {
            throw new DeliveryAccessDeniedException("Only the assigned driver can update this delivery location");
        }

        if (!Arrays.asList("ASSIGNED", "PICKED_UP").contains(delivery.getDeliveryStatus())) {
            throw new IllegalStateException("Can only update location for active deliveries. Current status: "
                    + delivery.getDeliveryStatus());
        }

        // Update precise coordinates
        delivery.setLatitude(request.getLatitude());
        delivery.setLongitude(request.getLongitude());

        // Update string representation for backward compatibility
        delivery.setCurrentLocation(request.getLatitude() + "," + request.getLongitude());

        Delivery updatedDelivery = deliveryRepository.save(delivery);
        log.info("Location updated for order {}: {},{}", delivery.getOrderId(),
                request.getLatitude(), request.getLongitude());

        return convertToDeliveryDTO(updatedDelivery);
    }

    /**
     * Gets the current location of a delivery driver for a specific order
     */
    public DeliveryDTO getDriverLocation(Long orderId) {
        Long currentUserId = authService.getCurrentUserId();

        List<Delivery> deliveries = deliveryRepository.findByOrderId(orderId);
        if (deliveries.isEmpty()) {
            throw new ResourceNotFoundException("No delivery found for order: " + orderId);
        }

        Delivery delivery = deliveries.get(0);

        // Check if the requester is the customer for this delivery
        if (!delivery.getCustomerId().equals(currentUserId) &&
                !authService.isAdmin() &&
                !delivery.getDriverId().equals(currentUserId)) {
            throw new DeliveryAccessDeniedException("You are not authorized to view this delivery's location");
        }

        return convertToDeliveryDTO(delivery);
    }

    /**
     * Enhanced DTO conversion that includes location data
     */
    private DeliveryDTO convertToDeliveryDTO(Delivery delivery) {
        DeliveryDTO dto = new DeliveryDTO();
        BeanUtils.copyProperties(delivery, dto);
        dto.setDriverName("Driver #" + delivery.getDriverId());

        // Ensure location data is properly set
        dto.setLatitude(delivery.getLatitude());
        dto.setLongitude(delivery.getLongitude());
        dto.setCurrentLocation(delivery.getCurrentLocation());

        return dto;
    }
}
