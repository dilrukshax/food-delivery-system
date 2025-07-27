package com.foodordering.paymentservice.controller;

import com.foodordering.paymentservice.dto.PaymentDTO;
import com.foodordering.paymentservice.dto.PaymentRequest;
import com.foodordering.paymentservice.dto.PaymentStatusUpdateRequest;
import com.foodordering.paymentservice.service.PaymentService;
import com.foodordering.paymentservice.service.StripeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.foodordering.paymentservice.dto.CheckoutSessionRequest;
import com.foodordering.paymentservice.dto.PaymentResponse;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestBody;
import com.foodordering.paymentservice.service.StripeService;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final StripeService stripeService;

    @Autowired
    public PaymentController(PaymentService paymentService, StripeService stripeService) {
        this.paymentService = paymentService;
        this.stripeService = stripeService;
    }

    @GetMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<List<PaymentDTO>> getAllPayments() {
        return ResponseEntity.ok(paymentService.getAllPayments());
    }

    @GetMapping("/{paymentId}")
    public ResponseEntity<PaymentDTO> getPaymentById(@PathVariable Long paymentId) {
        return ResponseEntity.ok(paymentService.getPaymentById(paymentId));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByCustomerId(@PathVariable Long customerId) {
        return ResponseEntity.ok(paymentService.getPaymentsByCustomerId(customerId));
    }

    @GetMapping("/order/{orderId}")
    public ResponseEntity<List<PaymentDTO>> getPaymentsByOrderId(@PathVariable Long orderId) {
        return ResponseEntity.ok(paymentService.getPaymentsByOrderId(orderId));
    }

    @PostMapping
    public ResponseEntity<PaymentDTO> createPayment(@Valid @RequestBody PaymentRequest request) {
        PaymentDTO createdPayment = paymentService.createPayment(request);
        return new ResponseEntity<>(createdPayment, HttpStatus.CREATED);
    }

    @PutMapping("/{paymentId}/status")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public ResponseEntity<PaymentDTO> updatePaymentStatus(
            @PathVariable Long paymentId,
            @Valid @RequestBody PaymentStatusUpdateRequest request) {
        return ResponseEntity.ok(paymentService.updatePaymentStatus(paymentId, request));
    }

    @PostMapping("/create-checkout-session")
    public ResponseEntity<PaymentResponse> createCheckoutSession(@RequestBody CheckoutSessionRequest request) {
        try {
            String sessionId = stripeService.createCheckoutSession(request);
            return ResponseEntity.ok(new PaymentResponse(sessionId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new PaymentResponse(null, e.getMessage()));
        }
    }

    @GetMapping("/verify-session/{sessionId}")
    public ResponseEntity<PaymentResponse> verifyPaymentSession(@PathVariable String sessionId) {
        try {
            boolean isValid = stripeService.verifyPaymentSession(sessionId);
            return ResponseEntity.ok(new PaymentResponse(isValid ? "success" : "failed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new PaymentResponse(null, e.getMessage()));
        }
    }
}
