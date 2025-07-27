package com.foodordering.userservice.controller;

import com.foodordering.userservice.dto.*;
import com.foodordering.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<UserProfileResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {

        PagedResponse<UserProfileResponse> users = userService.getAllUsers(page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{userId}")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Integer userId) {
        UserProfileResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/uuid/{uuid}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserByUuid(@PathVariable String uuid) {
        UserProfileResponse user = userService.getUserByUuid(uuid);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUserProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserProfileResponse user = userService.getCurrentUserProfile(email);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping(value = "/profile/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<UserProfileResponse>> uploadProfileImage(
            @RequestParam("file") MultipartFile file) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserProfileResponse user = userService.uploadProfileImage(email, file);
        return ResponseEntity.ok(ApiResponse.success("Profile image uploaded successfully", user));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestBody RegisterRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        UserProfileResponse user = userService.updateUserProfile(email, request, email);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", user));
    }

    @PutMapping("/{email}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserByAdmin(
            @PathVariable String email,
            @RequestBody RegisterRequest request) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String adminEmail = authentication.getName();
        UserProfileResponse user = userService.updateUserProfile(email, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("User updated successfully", user));
    }

    // Add these endpoints to your existing UserController

    @PostMapping("/addresses")
    public ResponseEntity<ApiResponse<AddressResponse>> addAddress(
            @RequestBody AddressRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        AddressResponse response = userService.addUserAddress(email, request);
        return ResponseEntity.ok(ApiResponse.success("Address added successfully", response));
    }

    @PutMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> updateAddress(
            @PathVariable Integer addressId,
            @RequestBody AddressRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        AddressResponse response = userService.updateUserAddress(email, addressId, request);
        return ResponseEntity.ok(ApiResponse.success("Address updated successfully", response));
    }

    @DeleteMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @PathVariable Integer addressId) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        userService.deleteUserAddress(email, addressId);
        return ResponseEntity.ok(ApiResponse.success("Address deleted successfully", null));
    }

    @GetMapping("/addresses")
    public ResponseEntity<ApiResponse<List<AddressResponse>>> getUserAddresses() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        List<AddressResponse> addresses = userService.getUserAddresses(email);
        return ResponseEntity.ok(ApiResponse.success(addresses));
    }

    @GetMapping("/addresses/default")
    public ResponseEntity<ApiResponse<AddressResponse>> getDefaultAddress() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        AddressResponse address = userService.getDefaultAddress(email);
        return ResponseEntity.ok(ApiResponse.success(address));
    }

    //get all DELIVERY_DRIVER
    @GetMapping("/delivery-drivers")
    @PreAuthorize("hasRole('RESTAURANT_ADMIN') or hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllDeliveryDrivers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "ASC") String direction) {

        List<UserProfileResponse> users = userService.getAllDeliveryDrivers(page, size, sortBy, direction);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    //get address by addressid
    @GetMapping("/addresses/{addressId}")
    public ResponseEntity<ApiResponse<AddressResponse>> getAddressById(
            @PathVariable Integer addressId) {
        AddressResponse address = userService.getUserAddressByaddressId(addressId);
        return ResponseEntity.ok(ApiResponse.success(address));
    }



}
