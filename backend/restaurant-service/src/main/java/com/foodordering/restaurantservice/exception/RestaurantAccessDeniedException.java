// Rename this class to avoid conflicts
package com.foodordering.restaurantservice.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class RestaurantAccessDeniedException extends RuntimeException {

    public RestaurantAccessDeniedException(String message) {
        super(message);
    }
}
