package com.foodordering.orderservice.service;

import com.foodordering.orderservice.dto.event.NotificationEvent;
import com.foodordering.orderservice.dto.event.OrderCreatedEvent;
import com.foodordering.orderservice.dto.event.OrderStatusChangedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;


import java.time.LocalDateTime;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class KafkaProducerService {

    private final KafkaTemplate<String, Object> kafkaTemplate;

    @Value("${kafka.topic.order-created}")
    private String orderCreatedTopic;

    @Value("${kafka.topic.order-status-changed}")
    private String orderStatusChangedTopic;

    @Value("${kafka.topic.notification}")
    private String notificationTopic;

    public void publishOrderCreatedEvent(OrderCreatedEvent event) {
        try {
            log.info("Publishing order created event for order ID: {}", event.getOrderId());

            CompletableFuture<SendResult<String, Object>> future =
                    kafkaTemplate.send(orderCreatedTopic, event.getOrderId().toString(), event);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Sent order created event for order ID: {} with offset: {}",
                            event.getOrderId(), result.getRecordMetadata().offset());

                    // Notify customer after successful kafka message
                    publishNotificationEvent(
                            "ORDER_CREATED",
                            "Order Placed Successfully",
                            "Your order #" + event.getOrderId() + " has been placed successfully. Total amount: $" + event.getTotalAmount(),
                            event.getCustomerId(),
                            "CUSTOMER",
                            event.getOrderId(),
                            "ORDER"
                    );

                    // Notify restaurant after successful kafka message
                    publishNotificationEvent(
                            "NEW_ORDER",
                            "New Order Received",
                            "You have received a new order #" + event.getOrderId() + ". Please confirm it as soon as possible.",
                            event.getRestaurantId(),
                            "RESTAURANT",
                            event.getOrderId(),
                            "ORDER"
                    );
                } else {
                    log.error("Unable to send order created event for order ID: {}, error: {}",
                            event.getOrderId(), ex.getMessage(), ex);
                }
            });
        } catch (Exception e) {
            log.error("Error publishing order created event: {}", e.getMessage(), e);
        }
    }

    public void publishOrderStatusChangedEvent(OrderStatusChangedEvent event) {
        try {
            log.info("Publishing order status changed event for order ID: {}", event.getOrderId());

            CompletableFuture<SendResult<String, Object>> future =
                    kafkaTemplate.send(orderStatusChangedTopic, event.getOrderId().toString(), event);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Sent order status changed event for order ID: {} with offset: {}",
                            event.getOrderId(), result.getRecordMetadata().offset());

                    // Create appropriate message based on status
                    String statusMessage = getStatusMessage(event.getNewStatus(), event.getOrderId());

                    // Notify customer
                    publishNotificationEvent(
                            "ORDER_STATUS_UPDATED",
                            "Order Status Updated",
                            statusMessage,
                            event.getCustomerId(),
                            "USER",
                            event.getOrderId(),
                            "ORDER"
                    );

                    // For certain statuses, notify restaurant as well
                    if (event.getNewStatus().equalsIgnoreCase("PICKED_UP") ||
                            event.getNewStatus().equalsIgnoreCase("DELIVERED")) {

                        String restaurantMessage = event.getNewStatus().equalsIgnoreCase("PICKED_UP")
                                ? "Order #" + event.getOrderId() + " has been picked up by the delivery driver."
                                : "Order #" + event.getOrderId() + " has been delivered to the customer.";

                        publishNotificationEvent(
                                "ORDER_STATUS_UPDATED",
                                "Order Status Updated",
                                restaurantMessage,
                                event.getRestaurantId(),
                                "RESTAURANT",
                                event.getOrderId(),
                                "ORDER"
                        );
                    }
                } else {
                    log.error("Unable to send order status changed event for order ID: {}, error: {}",
                            event.getOrderId(), ex.getMessage(), ex);
                }
            });
        } catch (Exception e) {
            log.error("Error publishing order status changed event: {}", e.getMessage(), e);
        }
    }

    private String getStatusMessage(String status, Long orderId) {
        switch (status.toUpperCase()) {
            case "CONFIRMED":
                return "Your order #" + orderId + " has been confirmed by the restaurant.";
            case "PREPARING":
                return "The restaurant has started preparing your order #" + orderId + ".";
            case "READY_FOR_PICKUP":
                return "Your order #" + orderId + " is ready for pickup by the delivery driver.";
            case "PICKED_UP":
                return "Your order #" + orderId + " has been picked up by the delivery driver and is on the way.";
            case "DELIVERED":
                return "Your order #" + orderId + " has been delivered. Enjoy your meal!";
            case "CANCELLED":
                return "Your order #" + orderId + " has been cancelled.";
            default:
                return "Your order #" + orderId + " status has been updated to " + status + ".";
        }
    }

    public void publishNotificationEvent(String type, String title, String message,
                                         Long recipientId, String recipientType,
                                         Long referenceId, String referenceType) {
        try {
            NotificationEvent event = new NotificationEvent(
                    type,
                    title,
                    message,
                    recipientId,
                    recipientType,
                    referenceId,
                    referenceType,
                    LocalDateTime.now()
            );

            log.info("Publishing notification event: {}", event);

            CompletableFuture<SendResult<String, Object>> future =
                    kafkaTemplate.send(notificationTopic, recipientId.toString(), event);

            future.whenComplete((result, ex) -> {
                if (ex == null) {
                    log.info("Sent notification event to recipient ID: {} with offset: {}",
                            recipientId, result.getRecordMetadata().offset());
                } else {
                    log.error("Unable to send notification event to recipient ID: {}, error: {}",
                            recipientId, ex.getMessage(), ex);
                }
            });
        } catch (Exception e) {
            log.error("Error publishing notification event: {}", e.getMessage(), e);
        }
    }
}
