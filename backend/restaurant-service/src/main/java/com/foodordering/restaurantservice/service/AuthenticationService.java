package com.foodordering.restaurantservice.service;

import com.foodordering.restaurantservice.config.UserPrincipal;
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

    public boolean isRestaurantOwner(Long restaurantOwnerId) {
        Long currentUserId = getCurrentUserId();
        String currentUserRole = getCurrentUserRole();

        return (currentUserId != null && currentUserId.equals(restaurantOwnerId))
                || "SYSTEM_ADMIN".equals(currentUserRole);
    }
}
