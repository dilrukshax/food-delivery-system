package com.foodordering.notificationservice.service;

import com.foodordering.notificationservice.dto.NotificationDTO;
import com.foodordering.notificationservice.entity.Notification;
import com.foodordering.notificationservice.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthenticationService authService;

    @Transactional
    public NotificationDTO createNotification(
            Long recipientId,
            String recipientType,
            String type,
            String title,
            String message,
            Long referenceId,
            String referenceType) {

        try {
            log.debug("Creating notification: recipient={}, type={}, title={}", recipientId, type, title);

            Notification notification = Notification.builder()
                    .recipientId(recipientId)
                    .recipientType(recipientType)
                    .type(type)
                    .title(title)
                    .message(message)
                    .read(false)
                    .referenceId(referenceId)
                    .referenceType(referenceType)
                    .createdAt(LocalDateTime.now())
                    .build();

            notification = notificationRepository.save(notification);
            log.info("Notification saved to database with ID: {}", notification.getId());

            NotificationDTO notificationDTO = convertToDTO(notification);

            // Send real-time notification via WebSocket
            String destination = switch (recipientType) {
                case "USER" -> "/topic/user." + recipientId;
                case "RESTAURANT" -> "/topic/restaurant." + recipientId;
                case "DRIVER" -> "/topic/driver." + recipientId;
                default -> null;
            };

            if (destination != null) {
                try {
                    log.debug("Sending notification to {}: {}", destination, notificationDTO);
                    messagingTemplate.convertAndSend(destination, notificationDTO);
                    log.debug("WebSocket message sent successfully");
                } catch (Exception e) {
                    // Log the error but don't fail the whole operation if WebSocket fails
                    log.error("Failed to send WebSocket notification: {}", e.getMessage(), e);
                }
            }

            return notificationDTO;
        } catch (Exception e) {
            log.error("Error creating notification: {}", e.getMessage(), e);
            throw e; // Re-throw to ensure transaction rollback
        }
    }

    public Page<NotificationDTO> getNotificationsForCurrentUser(Pageable pageable) {
        Long userId = authService.getCurrentUserId();
        String userRole = authService.getCurrentUserRole();

        if (userId == null) {
            throw new IllegalStateException("User not authenticated");
        }

        String recipientType = determineRecipientType(userRole);
        return notificationRepository
                .findByRecipientIdAndRecipientTypeOrderByCreatedAtDesc(userId, recipientType, pageable)
                .map(this::convertToDTO);
    }

    public long getUnreadNotificationCount() {
        Long userId = authService.getCurrentUserId();
        String userRole = authService.getCurrentUserRole();

        if (userId == null) {
            return 0;
        }

        String recipientType = determineRecipientType(userRole);
        return notificationRepository.countByRecipientIdAndRecipientTypeAndRead(userId, recipientType, false);
    }

    public List<NotificationDTO> getUnreadNotifications() {
        Long userId = authService.getCurrentUserId();
        String userRole = authService.getCurrentUserRole();

        if (userId == null) {
            return List.of();
        }

        String recipientType = determineRecipientType(userRole);
        return notificationRepository
                .findByRecipientIdAndRecipientTypeAndReadOrderByCreatedAtDesc(userId, recipientType, false)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public NotificationDTO markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));

        // Verify the current user owns this notification
        Long userId = authService.getCurrentUserId();
        String userRole = authService.getCurrentUserRole();
        String recipientType = determineRecipientType(userRole);

        if (!notification.getRecipientId().equals(userId) ||
                !notification.getRecipientType().equals(recipientType)) {
            throw new IllegalStateException("Cannot access this notification");
        }

        notification.setRead(true);
        notification = notificationRepository.save(notification);
        return convertToDTO(notification);
    }

    @Transactional
    public void markAllAsRead() {
        Long userId = authService.getCurrentUserId();
        String userRole = authService.getCurrentUserRole();

        if (userId == null) {
            return;
        }

        String recipientType = determineRecipientType(userRole);
        List<Notification> unreadNotifications = notificationRepository
                .findByRecipientIdAndRecipientTypeAndReadOrderByCreatedAtDesc(userId, recipientType, false);

        unreadNotifications.forEach(notification -> notification.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    private String determineRecipientType(String userRole) {
        if (userRole == null) {
            return "USER";
        }

        return switch (userRole.toUpperCase()) {
            case "RESTAURANT_ADMIN" -> "RESTAURANT";
            case "DELIVERY_DRIVER" -> "DRIVER";
            default -> "USER";
        };
    }

    private NotificationDTO convertToDTO(Notification notification) {
        return NotificationDTO.builder()
                .id(notification.getId())
                .recipientId(notification.getRecipientId())
                .recipientType(notification.getRecipientType())
                .type(notification.getType())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .read(notification.isRead())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
