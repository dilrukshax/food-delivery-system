package com.foodordering.deliveryservice.service;

import com.foodordering.deliveryservice.config.UserPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticationService {

    public Long getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getUserId();
        }
        return null;
    }

    public String getCurrentUserRole() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal) {
            return ((UserPrincipal) authentication.getPrincipal()).getRole();
        }
        return null;
    }

    public boolean isDeliveryDriver(Long driverId) {
        Long currentUserId = getCurrentUserId();
        String currentUserRole = getCurrentUserRole();

        return (currentUserId != null && currentUserId.equals(driverId) && "DELIVERY_DRIVER".equals(currentUserRole))
                || "SYSTEM_ADMIN".equals(currentUserRole);
    }

    public boolean isAdmin() {
        String currentUserRole = getCurrentUserRole();
        return "SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole);
    }
}
