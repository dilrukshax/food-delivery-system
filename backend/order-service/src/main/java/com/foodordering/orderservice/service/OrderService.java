package com.foodordering.orderservice.service;

import com.foodordering.orderservice.dto.*;
import com.foodordering.orderservice.dto.event.OrderCreatedEvent;
import com.foodordering.orderservice.dto.event.OrderStatusChangedEvent;
import com.foodordering.orderservice.entity.Order;
import com.foodordering.orderservice.entity.OrderItem;
import com.foodordering.orderservice.exception.OrderAccessDeniedException;
import com.foodordering.orderservice.exception.ResourceNotFoundException;
import com.foodordering.orderservice.repository.OrderItemRepository;
import com.foodordering.orderservice.repository.OrderRepository;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final AuthenticationService authService;
    private final KafkaProducerService kafkaProducerService;

    @Autowired
    public OrderService(
            OrderRepository orderRepository,
            OrderItemRepository orderItemRepository,
            AuthenticationService authService,
            KafkaProducerService kafkaProducerService) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.authService = authService;
        this.kafkaProducerService = kafkaProducerService;
    }

    // Get all orders - only for admins
    public List<OrderDTO> getAllOrders() {
        String currentUserRole = authService.getCurrentUserRole();
        if (!"SYSTEM_ADMIN".equals(currentUserRole)) {
            throw new OrderAccessDeniedException("Only system admins can view all orders");
        }

        return orderRepository.findAll().stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
    }

    // Get order by ID
    public OrderDTO getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + id));

        // Check if the user is authorized to view this order
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                "RESTAURANT_ADMIN".equals(currentUserRole) ||
                "DELIVERY_DRIVER".equals(currentUserRole) ||
                order.getCustomerId().equals(currentUserId))) {
            throw new OrderAccessDeniedException("You are not authorized to view this order");
        }

        return convertToOrderDTO(order);
    }

    // Get orders by customer ID
    public List<OrderDTO> getOrdersByCustomerId() {
        // Only the customer and system admins can view their orders
        Long customerId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();
        Long currentUserId = authService.getCurrentUserId();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || customerId.equals(currentUserId))) {
            throw new OrderAccessDeniedException("You can only view your own orders");
        }

        return orderRepository.findByCustomerId(customerId).stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
    }

    // Get orders by restaurant ID
    public List<OrderDTO> getOrdersByRestaurantId(Long restaurantId) {
        // Only restaurant owners and system admins can view restaurant orders
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            throw new OrderAccessDeniedException("Only restaurant owners can view their restaurant's orders");
        }

        return orderRepository.findByRestaurantId(restaurantId).stream()
                .map(this::convertToOrderDTO)
                .collect(Collectors.toList());
    }

    // Create a new order
    @Transactional
    public OrderDTO createOrder(OrderRequest request) {
        // Get current user ID from authentication context
        Long currentUserId = authService.getCurrentUserId();

        // Create new order
        Order order = new Order();
        order.setCustomerId(currentUserId);
        order.setRestaurantId(request.getRestaurantId());
        order.setCustomerAddressId(request.getCustomerAddressId());
        order.setOrderStatus("PENDING"); // Initial status

        // Calculate total amount
        BigDecimal totalAmount = BigDecimal.ZERO;
        for (OrderItemRequest itemRequest : request.getOrderItems()) {
            totalAmount = totalAmount.add(
                    itemRequest.getUnitPrice().multiply(BigDecimal.valueOf(itemRequest.getQuantity()))
            );
        }
        order.setTotalAmount(totalAmount);

        // Save order first to get the ID
        Order savedOrder = orderRepository.save(order);

        // Create and save order items
        for (OrderItemRequest itemRequest : request.getOrderItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(savedOrder);
            orderItem.setMenuItemId(itemRequest.getMenuItemId());
            orderItem.setQuantity(itemRequest.getQuantity());
            orderItem.setUnitPrice(itemRequest.getUnitPrice());
            orderItemRepository.save(orderItem);
            savedOrder.getOrderItems().add(orderItem);
        }

        // Publish order created event with notification
        OrderCreatedEvent event = new OrderCreatedEvent(
                savedOrder.getId(),
                savedOrder.getCustomerId(),
                savedOrder.getRestaurantId(),
                savedOrder.getOrderStatus(),
                savedOrder.getTotalAmount().doubleValue(),
                LocalDateTime.now()
        );
        kafkaProducerService.publishOrderCreatedEvent(event);

        return convertToOrderDTO(savedOrder);
    }

    // Update order status
    @Transactional
    public OrderDTO updateOrderStatus(Long orderId, OrderStatusUpdateRequest request) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Verify if the user is authorized to update this order
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            throw new OrderAccessDeniedException("Only restaurant owners or admins can update order status");
        }

        String previousStatus = order.getOrderStatus();
        order.setOrderStatus(request.getOrderStatus());
        Order updatedOrder = orderRepository.save(order);

        // Publish order status changed event with notification
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                updatedOrder.getId(),
                updatedOrder.getCustomerId(),
                updatedOrder.getRestaurantId(),
                previousStatus,
                updatedOrder.getOrderStatus(),
                LocalDateTime.now()
        );
        kafkaProducerService.publishOrderStatusChangedEvent(event);

        return convertToOrderDTO(updatedOrder);
    }

    // Cancel an order
    @Transactional
    public void cancelOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        // Verify if the user is authorized to cancel this order
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || order.getCustomerId().equals(currentUserId))) {
            throw new OrderAccessDeniedException("You can only cancel your own orders");
        }

        // Check if order can be cancelled
        if ("DELIVERED".equalsIgnoreCase(order.getOrderStatus()) ||
                "CANCELLED".equalsIgnoreCase(order.getOrderStatus())) {
            throw new IllegalStateException("Cannot cancel an order that is already delivered or cancelled");
        }

        String previousStatus = order.getOrderStatus();
        order.setOrderStatus("CANCELLED");
        Order updatedOrder = orderRepository.save(order);

        // Publish order status changed event for cancellation with notification
        OrderStatusChangedEvent event = new OrderStatusChangedEvent(
                updatedOrder.getId(),
                updatedOrder.getCustomerId(),
                updatedOrder.getRestaurantId(),
                previousStatus,
                updatedOrder.getOrderStatus(),
                LocalDateTime.now()
        );
        kafkaProducerService.publishOrderStatusChangedEvent(event);
    }

    // Helper methods to convert Entity to DTO
    private OrderDTO convertToOrderDTO(Order order) {
        OrderDTO dto = new OrderDTO();
        BeanUtils.copyProperties(order, dto);

        List<OrderItemDTO> orderItemDTOs = order.getOrderItems().stream()
                .map(this::convertToOrderItemDTO)
                .collect(Collectors.toList());

        dto.setOrderItems(orderItemDTOs);
        return dto;
    }

    private OrderItemDTO convertToOrderItemDTO(OrderItem orderItem) {
        OrderItemDTO dto = new OrderItemDTO();
        BeanUtils.copyProperties(orderItem, dto);
        dto.setOrderId(orderItem.getOrder().getId());
        return dto;
    }
}
