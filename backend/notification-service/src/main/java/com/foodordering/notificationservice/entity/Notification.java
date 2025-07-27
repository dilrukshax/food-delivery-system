package com.foodordering.notificationservice.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "recipient_id", nullable = false)
    private Long recipientId;

    @Column(name = "recipient_type", nullable = false)
    private String recipientType; // USER, RESTAURANT, DRIVER

    @Column(name = "type", nullable = false)
    private String type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, length = 1000)
    private String message;

    @Column(name = "read", nullable = false)
    private boolean read;

    @Column(name = "reference_id")
    private Long referenceId; // Order ID, Delivery ID

    @Column(name = "reference_type")
    private String referenceType; // ORDER, DELIVERY

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
