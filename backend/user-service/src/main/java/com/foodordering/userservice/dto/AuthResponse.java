package com.foodordering.userservice.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

public class AuthResponse {
    private String uuid;
    private int id;
    private String firstName;
    private String lastName;
    private String email;
    private String role;
    private String profileImageUrl;
    private String accessToken;
    private String refreshToken;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime tokenExpiration;

    // Default constructor
    public AuthResponse() {}

    // All args constructor
    public AuthResponse(String uuid, int id, String firstName, String lastName, String email, 
                       String role, String profileImageUrl, String accessToken, String refreshToken, 
                       LocalDateTime tokenExpiration) {
        this.uuid = uuid;
        this.id = id;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.role = role;
        this.profileImageUrl = profileImageUrl;
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenExpiration = tokenExpiration;
    }

    // Getters and setters
    public String getUuid() {
        return uuid;
    }

    public void setUuid(String uuid) {
        this.uuid = uuid;
    }

    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getProfileImageUrl() {
        return profileImageUrl;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public LocalDateTime getTokenExpiration() {
        return tokenExpiration;
    }

    public void setTokenExpiration(LocalDateTime tokenExpiration) {
        this.tokenExpiration = tokenExpiration;
    }

    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String uuid;
        private int id;
        private String firstName;
        private String lastName;
        private String email;
        private String role;
        private String profileImageUrl;
        private String accessToken;
        private String refreshToken;
        private LocalDateTime tokenExpiration;

        public Builder uuid(String uuid) {
            this.uuid = uuid;
            return this;
        }

        public Builder id(int id) {
            this.id = id;
            return this;
        }

        public Builder firstName(String firstName) {
            this.firstName = firstName;
            return this;
        }

        public Builder lastName(String lastName) {
            this.lastName = lastName;
            return this;
        }

        public Builder email(String email) {
            this.email = email;
            return this;
        }

        public Builder role(String role) {
            this.role = role;
            return this;
        }

        public Builder profileImageUrl(String profileImageUrl) {
            this.profileImageUrl = profileImageUrl;
            return this;
        }

        public Builder accessToken(String accessToken) {
            this.accessToken = accessToken;
            return this;
        }

        public Builder refreshToken(String refreshToken) {
            this.refreshToken = refreshToken;
            return this;
        }

        public Builder tokenExpiration(LocalDateTime tokenExpiration) {
            this.tokenExpiration = tokenExpiration;
            return this;
        }

        public AuthResponse build() {
            return new AuthResponse(uuid, id, firstName, lastName, email, role, profileImageUrl, 
                                  accessToken, refreshToken, tokenExpiration);
        }
    }
}
