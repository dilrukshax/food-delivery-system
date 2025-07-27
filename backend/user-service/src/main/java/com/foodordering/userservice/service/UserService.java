package com.foodordering.userservice.service;

import com.foodordering.userservice.dto.*;
import com.foodordering.userservice.entity.User;
import com.foodordering.userservice.entity.UserAddress;
import com.foodordering.userservice.repository.UserAddressRepository;
import com.foodordering.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final AzureStorageService azureStorageService;

    public PagedResponse<UserProfileResponse> getAllUsers(int page, int size, String sortBy, String direction) {
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> userPage = userRepository.findAll(pageable);

        List<UserProfileResponse> users = userPage.getContent().stream()
                .map(this::mapToUserProfileResponse)
                .collect(Collectors.toList());

        return new PagedResponse<>(
                users,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isLast()
        );
    }

    public UserProfileResponse getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        return mapToUserProfileResponse(user);
    }

    public UserProfileResponse getUserByUuid(String uuid) {
        User user = userRepository.findByUuid(uuid)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with uuid: " + uuid));

        return mapToUserProfileResponse(user);
    }

    public UserProfileResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        return mapToUserProfileResponse(user);
    }

    private UserProfileResponse mapToUserProfileResponse(User user) {
        List<UserAddress> addresses = userAddressRepository.findByUser(user);

        List<AddressResponse> addressResponses = addresses.stream()
                .map(address -> AddressResponse.builder()
                        .id(address.getId())
                        .addressLine1(address.getAddressLine1())
                        .addressLine2(address.getAddressLine2())
                        .city(address.getCity())
                        .state(address.getState())
                        .country(address.getCountry())
                        .postalCode(address.getPostalCode())
                        .isDefault(address.isDefault())
                        .latitude(address.getLatitude())
                        .longitude(address.getLongitude())
                        .build())
                .collect(Collectors.toList());

        return UserProfileResponse.builder()
                .uuid(user.getUuid())
                .id(user.getId())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .city(user.getCity())
                .role(user.getRole())
                .profileImageUrl(user.getProfileImageUrl())
                .isActive(user.isActive())
                .createdAt(user.getCreatedAt())
                .addresses(addressResponses)
                .build();
    }

    @Transactional
    public UserProfileResponse uploadProfileImage(String email, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.startsWith("image/"))) {
            throw new IllegalArgumentException("Only image files are allowed");
        }

        // Check file size (limit to 5MB)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new IllegalArgumentException("File size cannot exceed 5MB");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        try {
            // Delete old image if exists
            if (user.getProfileImageUrl() != null && !user.getProfileImageUrl().isEmpty()) {
                azureStorageService.deleteFile(user.getProfileImageUrl());
            }

            // Upload new image
            String imageUrl = azureStorageService.uploadFile(file);
            user.setProfileImageUrl(imageUrl);
            userRepository.save(user);

            return mapToUserProfileResponse(user);
        } catch (IOException e) {
            throw new RuntimeException("Failed to upload profile image", e);
        }
    }

    @Transactional
    public UserProfileResponse updateUserProfile(String email, RegisterRequest request, String currentUserEmail) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // Only admin can update other users or user can update their own profile
        User currentUser = userRepository.findByEmail(currentUserEmail)
                .orElseThrow(() -> new UsernameNotFoundException("Current user not found"));

        if (!currentUser.getRole().equals("SYSTEM_ADMIN") && !email.equals(currentUserEmail)) {
            throw new AccessDeniedException("You don't have permission to update this user");
        }

        // Update user fields if provided
        if (request.getFirstName() != null && !request.getFirstName().isEmpty()) {
            user.setFirstName(request.getFirstName());
        }

        if (request.getLastName() != null && !request.getLastName().isEmpty()) {
            user.setLastName(request.getLastName());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getCity() != null) {
            user.setCity(request.getCity());
        }

        // Only admin can update role
        if (currentUser.getRole().equals("SYSTEM_ADMIN") && request.getRole() != null &&
                (request.getRole().equals("CUSTOMER") || request.getRole().equals("RESTAURANT_ADMIN") ||
                        request.getRole().equals("DELIVERY_DRIVER") || request.getRole().equals("SYSTEM_ADMIN"))) {
            user.setRole(request.getRole());
        }

        userRepository.save(user);

        return mapToUserProfileResponse(user);
    }

    // Add these methods to your existing UserService class

    @Transactional
    public AddressResponse addUserAddress(String email, AddressRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        UserAddress address = UserAddress.builder()
                .user(user)
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .city(request.getCity())
                .state(request.getState())
                .country(request.getCountry())
                .postalCode(request.getPostalCode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(request.isDefault())
                .build();

        // If setting as default, unset previous default
        if(request.isDefault()) {
            userAddressRepository.findByUserAndIsDefaultTrue(user)
                    .ifPresent(currentDefault -> {
                        currentDefault.setDefault(false);
                        userAddressRepository.save(currentDefault);
                    });
        }

        UserAddress savedAddress = userAddressRepository.save(address);
        return mapToAddressResponse(savedAddress);
    }

    //get user address by addressid
    @Transactional
    public AddressResponse getUserAddressByaddressId(Integer addressId) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        return mapToAddressResponse(address);
    }
    

    @Transactional
    public AddressResponse updateUserAddress(String email, Integer addressId, AddressRequest request) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        // Verify address belongs to user
        if(!address.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("You don't own this address");
        }

        address.setAddressLine1(request.getAddressLine1());
        address.setAddressLine2(request.getAddressLine2());
        address.setCity(request.getCity());
        address.setState(request.getState());
        address.setCountry(request.getCountry());
        address.setPostalCode(request.getPostalCode());
        address.setLatitude(request.getLatitude());
        address.setLongitude(request.getLongitude());

        // Handle default address change
        if(request.isDefault() && !address.isDefault()) {
            userAddressRepository.findByUserAndIsDefaultTrue(address.getUser())
                    .ifPresent(currentDefault -> {
                        currentDefault.setDefault(false);
                        userAddressRepository.save(currentDefault);
                    });
            address.setDefault(true);
        }

        UserAddress updatedAddress = userAddressRepository.save(address);
        return mapToAddressResponse(updatedAddress);
    }

    @Transactional
    public void deleteUserAddress(String email, Integer addressId) {
        UserAddress address = userAddressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found"));

        if(!address.getUser().getEmail().equals(email)) {
            throw new AccessDeniedException("You don't own this address");
        }

        userAddressRepository.delete(address);
    }

    public List<AddressResponse> getUserAddresses(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return userAddressRepository.findByUser(user).stream()
                .map(this::mapToAddressResponse)
                .collect(Collectors.toList());
    }

    public AddressResponse getDefaultAddress(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return userAddressRepository.findByUserAndIsDefaultTrue(user)
                .map(this::mapToAddressResponse)
                .orElseThrow(() -> new RuntimeException("No default address found"));
    }

    private AddressResponse mapToAddressResponse(UserAddress address) {
        return AddressResponse.builder()
                .id(address.getId())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .city(address.getCity())
                .state(address.getState())
                .country(address.getCountry())
                .postalCode(address.getPostalCode())
                .isDefault(address.isDefault())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .build();
    }

    //get all DELIVERY_DRIVER
    public List<UserProfileResponse> getAllDeliveryDrivers(int page, int size, String sortBy, String direction){
        Sort sort = Sort.by(Sort.Direction.fromString(direction), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<User> userPage = userRepository.findByRole("DELIVERY_DRIVER", pageable);

        List<UserProfileResponse> users = userPage.getContent().stream()
                .map(this::mapToUserProfileResponse)
                .collect(Collectors.toList());

        return users;
    }

}
