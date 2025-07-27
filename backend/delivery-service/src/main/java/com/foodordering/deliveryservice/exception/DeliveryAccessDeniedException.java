package com.foodordering.deliveryservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class DeliveryAccessDeniedException extends RuntimeException {

    public DeliveryAccessDeniedException(String message) {
        super(message);
    }
}
