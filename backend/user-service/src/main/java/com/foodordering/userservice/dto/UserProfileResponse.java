package com.foodordering.userservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

public class UserProfileResponse {
    private int id;
    private String uuid;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String city;
    private String role;
    private String profileImageUrl;
    private boolean isActive;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    private List<AddressResponse> addresses;

    // Constructors
    public UserProfileResponse() {}

    public UserProfileResponse(int id, String uuid, String firstName, String lastName, String email, 
                              String phone, String city, String role, String profileImageUrl, 
                              boolean isActive, LocalDateTime createdAt, List<AddressResponse> addresses) {
        this.id = id;
        this.uuid = uuid;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.phone = phone;
        this.city = city;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
        this.isActive = isActive;
        this.createdAt = createdAt;
        this.addresses = addresses;
    }

    // Getters and Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public String getUuid() { return uuid; }
    public void setUuid(String uuid) { this.uuid = uuid; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getProfileImageUrl() { return profileImageUrl; }
    public void setProfileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public List<AddressResponse> getAddresses() { return addresses; }
    public void setAddresses(List<AddressResponse> addresses) { this.addresses = addresses; }

    // Builder
    public static UserProfileResponseBuilder builder() {
        return new UserProfileResponseBuilder();
    }

    public static class UserProfileResponseBuilder {
        private int id;
        private String uuid;
        private String firstName;
        private String lastName;
        private String email;
        private String phone;
        private String city;
        private String role;
        private String profileImageUrl;
        private boolean isActive;
        private LocalDateTime createdAt;
        private List<AddressResponse> addresses;

        public UserProfileResponseBuilder id(int id) { this.id = id; return this; }
        public UserProfileResponseBuilder uuid(String uuid) { this.uuid = uuid; return this; }
        public UserProfileResponseBuilder firstName(String firstName) { this.firstName = firstName; return this; }
        public UserProfileResponseBuilder lastName(String lastName) { this.lastName = lastName; return this; }
        public UserProfileResponseBuilder email(String email) { this.email = email; return this; }
        public UserProfileResponseBuilder phone(String phone) { this.phone = phone; return this; }
        public UserProfileResponseBuilder city(String city) { this.city = city; return this; }
        public UserProfileResponseBuilder role(String role) { this.role = role; return this; }
        public UserProfileResponseBuilder profileImageUrl(String profileImageUrl) { this.profileImageUrl = profileImageUrl; return this; }
        public UserProfileResponseBuilder isActive(boolean isActive) { this.isActive = isActive; return this; }
        public UserProfileResponseBuilder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserProfileResponseBuilder addresses(List<AddressResponse> addresses) { this.addresses = addresses; return this; }

        public UserProfileResponse build() {
            return new UserProfileResponse(id, uuid, firstName, lastName, email, phone, city, 
                                         role, profileImageUrl, isActive, createdAt, addresses);
        }
    }
}
