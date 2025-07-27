package com.foodordering.notificationservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationDTO {
    private Long id;
    private Long recipientId;
    private String recipientType;
    private String type;
    private String title;
    private String message;
    private boolean read;
    private Long referenceId;
    private String referenceType;
    private LocalDateTime createdAt;
}
