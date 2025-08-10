package com.foodordering.userservice.controller;

import com.foodordering.userservice.dto.ApiResponse;
import com.foodordering.userservice.dto.UserProfileResponse;
import com.foodordering.userservice.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class SimpleAdminController {

    @Autowired
    private UserService userService;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Admin functionality is working!");
    }

    @GetMapping("/users/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Integer userId) {
        UserProfileResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
