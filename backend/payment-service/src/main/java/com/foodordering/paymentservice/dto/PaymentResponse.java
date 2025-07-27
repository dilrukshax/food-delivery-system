// src/main/java/com/foodordering/api/dto/PaymentResponse.java
package com.foodordering.paymentservice.dto;

public class PaymentResponse {
    private String sessionId;
    private String status;
    private String error;

    public PaymentResponse(String sessionId) {
        this.sessionId = sessionId;
        this.status = "success";
    }

    public PaymentResponse(String status, String error) {
        this.status = status;
        this.error = error;
    }

    // Getters and setters
    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }
}