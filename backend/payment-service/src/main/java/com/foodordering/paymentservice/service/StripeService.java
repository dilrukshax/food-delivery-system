// src/main/java/com/foodordering/api/service/StripeService.java
package com.foodordering.paymentservice.service;

import com.foodordering.paymentservice.dto.CheckoutSessionRequest;
import com.foodordering.paymentservice.dto.OrderItem;
import com.stripe.exception.StripeException;
import com.stripe.model.checkout.Session;
import com.stripe.param.checkout.SessionCreateParams;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class StripeService {

    public String createCheckoutSession(CheckoutSessionRequest request) throws StripeException {
        // Create line items
        List<SessionCreateParams.LineItem> lineItems = new ArrayList<>();

        for (OrderItem item : request.getOrderItems()) {
            lineItems.add(
                    SessionCreateParams.LineItem.builder()
                            .setPriceData(
                                    SessionCreateParams.LineItem.PriceData.builder()
                                            .setCurrency("usd")
                                            .setUnitAmount((long)(item.getPrice() * 100)) // Convert to cents
                                            .setProductData(
                                                    SessionCreateParams.LineItem.PriceData.ProductData.builder()
                                                            .setName(item.getName())
                                                            .setDescription(item.getDescription())
                                                            .build()
                                            )
                                            .build()
                            )
                            .setQuantity((long)item.getQuantity())
                            .build()
            );
        }

        // Build the session parameters
        SessionCreateParams params = SessionCreateParams.builder()
                .setMode(SessionCreateParams.Mode.PAYMENT)
                .setSuccessUrl(request.getSuccessUrl())
                .setCancelUrl(request.getCancelUrl())
                .setCustomerEmail(request.getCustomerEmail())
                .addAllLineItem(lineItems)
                .build();

        // Create the session
        Session session = Session.create(params);
        return session.getId();
    }

    public boolean verifyPaymentSession(String sessionId) throws StripeException {
        Session session = Session.retrieve(sessionId);
        return "paid".equals(session.getPaymentStatus());
    }
}
