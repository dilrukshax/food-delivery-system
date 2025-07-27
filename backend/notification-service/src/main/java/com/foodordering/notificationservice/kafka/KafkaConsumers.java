package com.foodordering.notificationservice.kafka;

import com.foodordering.notificationservice.dto.event.*;
import com.foodordering.notificationservice.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
@Slf4j
public class KafkaConsumers {

    private final NotificationService notificationService;
    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("hh:mm a");

    @KafkaListener(topics = "${kafka.topic.order-created}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleOrderCreated(OrderCreatedEvent event, Acknowledgment ack) {
        log.info("Received order created event: {}", event);
        try {
            // Notify the customer
            notificationService.createNotification(
                    event.getCustomerId(),
                    "USER",
                    "ORDER_CREATED",
                    "Order Placed Successfully",
                    "Your order #" + event.getOrderId() + " has been placed successfully. " +
                            "Total amount: $" + event.getTotalAmount(),
                    event.getOrderId(),
                    "ORDER"
            );

            // Notify the restaurant
            notificationService.createNotification(
                    event.getRestaurantId(),
                    "RESTAURANT",
                    "NEW_ORDER",
                    "New Order Received",
                    "You have received a new order #" + event.getOrderId() + ". " +
                            "Please confirm it as soon as possible.",
                    event.getOrderId(),
                    "ORDER"
            );

            // Acknowledge the message after successful processing
            ack.acknowledge();
            log.info("Successfully processed order created event for order ID: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Error processing order created event: {}", e.getMessage(), e);
            // Don't acknowledge - this will cause the message to be redelivered
        }
    }

    @KafkaListener(topics = "${kafka.topic.order-status-changed}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleOrderStatusChanged(OrderStatusChangedEvent event, Acknowledgment ack) {
        log.info("Received order status changed event: {}", event);
        try {
            String statusMessage = switch (event.getNewStatus().toUpperCase()) {
                case "CONFIRMED" -> "Your order has been confirmed by the restaurant.";
                case "PREPARING" -> "The restaurant has started preparing your order.";
                case "READY_FOR_PICKUP" -> "Your order is ready for pickup by the delivery driver.";
                case "PICKED_UP" -> "Your order has been picked up by the delivery driver and is on the way.";
                case "DELIVERED" -> "Your order has been delivered. Enjoy your meal!";
                case "CANCELLED" -> "Your order has been cancelled.";
                default -> "Your order status has been updated to " + event.getNewStatus();
            };

            // Notify the customer
            notificationService.createNotification(
                    event.getCustomerId(),
                    "USER",
                    "ORDER_STATUS_UPDATED",
                    "Order Status Updated",
                    "Order #" + event.getOrderId() + ": " + statusMessage,
                    event.getOrderId(),
                    "ORDER"
            );

            // Notify the restaurant for relevant status changes
            if (event.getNewStatus().equalsIgnoreCase("PICKED_UP") ||
                    event.getNewStatus().equalsIgnoreCase("DELIVERED")) {

                String restaurantMessage = event.getNewStatus().equalsIgnoreCase("PICKED_UP")
                        ? "Order #" + event.getOrderId() + " has been picked up by the delivery driver."
                        : "Order #" + event.getOrderId() + " has been delivered to the customer.";

                notificationService.createNotification(
                        event.getRestaurantId(),
                        "RESTAURANT",
                        "ORDER_STATUS_UPDATED",
                        "Order Status Updated",
                        restaurantMessage,
                        event.getOrderId(),
                        "ORDER"
                );
            }

            // Acknowledge the message after successful processing
            ack.acknowledge();
            log.info("Successfully processed order status change event for order ID: {}", event.getOrderId());
        } catch (Exception e) {
            log.error("Error processing order status changed event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.delivery-assigned}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleDeliveryAssigned(DeliveryAssignedEvent event, Acknowledgment ack) {
        log.info("Received delivery assigned event: {}", event);
        try {
            String estimatedTime = event.getEstimatedDeliveryTime() != null
                    ? event.getEstimatedDeliveryTime().format(TIME_FORMATTER)
                    : "as soon as possible";

            // Notify the driver
            notificationService.createNotification(
                    event.getDriverId(),
                    "DRIVER",
                    "DELIVERY_ASSIGNED",
                    "New Delivery Assignment",
                    "You have been assigned to deliver order #" + event.getOrderId() + ". " +
                            "Please pick up the order from the restaurant.",
                    event.getDeliveryId(),
                    "DELIVERY"
            );

            // Notify the customer
            notificationService.createNotification(
                    event.getCustomerId(),
                    "USER",
                    "DELIVERY_ASSIGNED",
                    "Delivery Driver Assigned",
                    "A delivery driver has been assigned to your order #" + event.getOrderId() + ". " +
                            "Estimated delivery time: " + estimatedTime,
                    event.getDeliveryId(),
                    "DELIVERY"
            );

            // Notify the restaurant
            notificationService.createNotification(
                    event.getRestaurantId(),
                    "RESTAURANT",
                    "DELIVERY_ASSIGNED",
                    "Delivery Driver Assigned",
                    "A delivery driver has been assigned to order #" + event.getOrderId() + ". " +
                            "The driver will arrive to pick up the order.",
                    event.getDeliveryId(),
                    "DELIVERY"
            );

            // Acknowledge the message after successful processing
            ack.acknowledge();
            log.info("Successfully processed delivery assigned event for delivery ID: {}", event.getDeliveryId());
        } catch (Exception e) {
            log.error("Error processing delivery assigned event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "${kafka.topic.delivery-status-changed}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleDeliveryStatusChanged(DeliveryStatusChangedEvent event, Acknowledgment ack) {
        log.info("Received delivery status changed event: {}", event);
        try {
            String customerMessage = "";
            String driverMessage = "";
            String restaurantMessage = "";

            switch (event.getNewStatus().toUpperCase()) {
                case "PICKED_UP":
                    customerMessage = "Your order #" + event.getOrderId() + " has been picked up by the driver and is on its way to you.";
                    restaurantMessage = "Order #" + event.getOrderId() + " has been picked up by the driver.";
                    break;
                case "DELIVERED":
                    customerMessage = "Your order #" + event.getOrderId() + " has been delivered. Enjoy your meal!";
                    driverMessage = "Order #" + event.getOrderId() + " has been marked as delivered. Thank you!";
                    restaurantMessage = "Order #" + event.getOrderId() + " has been delivered to the customer.";
                    break;
                case "CANCELLED":
                    customerMessage = "We're sorry, but the delivery for your order #" + event.getOrderId() + " has been cancelled.";
                    driverMessage = "The delivery for order #" + event.getOrderId() + " has been cancelled.";
                    restaurantMessage = "The delivery for order #" + event.getOrderId() + " has been cancelled.";
                    break;
                default:
                    customerMessage = "The status of your delivery for order #" + event.getOrderId() + " has been updated to " + event.getNewStatus() + ".";
                    break;
            }

            // Send notifications to all parties
            if (!customerMessage.isEmpty()) {
                notificationService.createNotification(
                        event.getCustomerId(),
                        "USER",
                        "DELIVERY_STATUS_UPDATED",
                        "Delivery Status Updated",
                        customerMessage,
                        event.getDeliveryId(),
                        "DELIVERY"
                );
            }

            if (!driverMessage.isEmpty()) {
                notificationService.createNotification(
                        event.getDriverId(),
                        "DRIVER",
                        "DELIVERY_STATUS_UPDATED",
                        "Delivery Status Updated",
                        driverMessage,
                        event.getDeliveryId(),
                        "DELIVERY"
                );
            }

            if (!restaurantMessage.isEmpty()) {
                notificationService.createNotification(
                        event.getRestaurantId(),
                        "RESTAURANT",
                        "DELIVERY_STATUS_UPDATED",
                        "Delivery Status Updated",
                        restaurantMessage,
                        event.getDeliveryId(),
                        "DELIVERY"
                );
            }

            // Acknowledge the message after successful processing
            ack.acknowledge();
            log.info("Successfully processed delivery status change event for delivery ID: {}", event.getDeliveryId());
        } catch (Exception e) {
            log.error("Error processing delivery status changed event: {}", e.getMessage(), e);
        }
    }

    // Add a listener for the notification topic from order service
    @KafkaListener(topics = "${kafka.topic.notification}", groupId = "${spring.kafka.consumer.group-id}")
    public void handleNotification(NotificationEvent event, Acknowledgment ack) {
        log.info("Received direct notification event: {}", event);
        try {
            notificationService.createNotification(
                    event.getRecipientId(),
                    event.getRecipientType(),
                    event.getType(),
                    event.getTitle(),
                    event.getMessage(),
                    event.getReferenceId(),
                    event.getReferenceType()
            );

            // Acknowledge the message after successful processing
            ack.acknowledge();
            log.info("Successfully processed notification event for recipient ID: {}", event.getRecipientId());
        } catch (Exception e) {
            log.error("Error processing notification event: {}", e.getMessage(), e);
        }
    }
}
