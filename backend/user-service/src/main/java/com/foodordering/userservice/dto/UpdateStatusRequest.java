package com.foodordering.userservice.dto;

import jakarta.validation.constraints.NotNull;

public class UpdateStatusRequest {
    
    @NotNull(message = "Status is required")
    private Boolean isActive;

    // Constructors
    public UpdateStatusRequest() {}

    public UpdateStatusRequest(Boolean isActive) {
        this.isActive = isActive;
    }

    // Getters and Setters
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
