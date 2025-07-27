package com.foodordering.paymentservice.service;

import com.foodordering.paymentservice.dto.PaymentDTO;
import com.foodordering.paymentservice.dto.PaymentRequest;
import com.foodordering.paymentservice.dto.PaymentStatusUpdateRequest;
import com.foodordering.paymentservice.entity.Payment;
import com.foodordering.paymentservice.exception.PaymentAccessDeniedException;
import com.foodordering.paymentservice.exception.ResourceNotFoundException;
import com.foodordering.paymentservice.repository.PaymentRepository;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final AuthenticationService authService;

    @Autowired
    public PaymentService(
            PaymentRepository paymentRepository,
            AuthenticationService authService) {
        this.paymentRepository = paymentRepository;
        this.authService = authService;
    }

    // Get all payments - only for admins
    public List<PaymentDTO> getAllPayments() {
        String currentUserRole = authService.getCurrentUserRole();
        if (!"SYSTEM_ADMIN".equals(currentUserRole)) {
            throw new PaymentAccessDeniedException("Only system admins can view all payments");
        }

        return paymentRepository.findAll().stream()
                .map(this::convertToPaymentDTO)
                .collect(Collectors.toList());
    }

    // Get payment by ID
    public PaymentDTO getPaymentById(Long id) {
        Payment payment = paymentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + id));

        // Check if the user is authorized to view this payment
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) ||
                "RESTAURANT_ADMIN".equals(currentUserRole) ||
                payment.getCustomerId().equals(currentUserId))) {
            throw new PaymentAccessDeniedException("You are not authorized to view this payment");
        }

        return convertToPaymentDTO(payment);
    }

    // Get payments by customer ID
    public List<PaymentDTO> getPaymentsByCustomerId(Long customerId) {
        // Customers can only view their own payments
        Long currentUserId = authService.getCurrentUserId();
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole) || customerId.equals(currentUserId))) {
            throw new PaymentAccessDeniedException("You can only view your own payments");
        }

        return paymentRepository.findByCustomerId(customerId).stream()
                .map(this::convertToPaymentDTO)
                .collect(Collectors.toList());
    }

    // Get payments by order ID
    public List<PaymentDTO> getPaymentsByOrderId(Long orderId) {
        // Only authorized users can view order payments
        String currentUserRole = authService.getCurrentUserRole();
        Long currentUserId = authService.getCurrentUserId();

        List<Payment> payments = paymentRepository.findByOrderId(orderId);

        // If user is not admin, check if they own any of the payments
        if (!("SYSTEM_ADMIN".equals(currentUserRole) || "RESTAURANT_ADMIN".equals(currentUserRole))) {
            boolean isOwner = payments.stream()
                    .anyMatch(payment -> payment.getCustomerId().equals(currentUserId));

            if (!isOwner) {
                throw new PaymentAccessDeniedException("You are not authorized to view these payments");
            }
        }

        return payments.stream()
                .map(this::convertToPaymentDTO)
                .collect(Collectors.toList());
    }

//    // Create a new payment
//    @Transactional
//    public PaymentDTO createPayment(PaymentRequest request) {
//        // Get current user ID from authentication context
//        Long currentUserId = authService.getCurrentUserId();
//
//        // Create new payment
//        Payment payment = new Payment();
//        payment.setOrderId(request.getOrderId());
//        payment.setCustomerId(currentUserId);
//        payment.setAmount(request.getAmount());
//        payment.setPaymentMethod(request.getPaymentMethod());
//        payment.setPaymentStatus("pending"); // Initial status
//
//        // In a real implementation, here you would integrate with a payment gateway
//        // such as Stripe, PayPal, etc. to process the payment
//
//        // For demo purposes, we're just saving the payment
//        Payment savedPayment = paymentRepository.save(payment);
//
//        return convertToPaymentDTO(savedPayment);
//    }

    // Update payment status (e.g., when payment gateway callbacks are received)
    @Transactional
    public PaymentDTO updatePaymentStatus(Long paymentId, PaymentStatusUpdateRequest request) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found with id: " + paymentId));

        // Only system admins or the payment processor service should update payment status
        String currentUserRole = authService.getCurrentUserRole();

        if (!("SYSTEM_ADMIN".equals(currentUserRole))) {
            throw new PaymentAccessDeniedException("Only system admins can update payment status");
        }

        payment.setPaymentStatus(request.getPaymentStatus());
        Payment updatedPayment = paymentRepository.save(payment);

        return convertToPaymentDTO(updatedPayment);
    }

    // Helper method to convert Entity to DTO
    private PaymentDTO convertToPaymentDTO(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        BeanUtils.copyProperties(payment, dto);
        return dto;
    }

    @Transactional
    public PaymentDTO createPayment(PaymentRequest request) {
        // Get current user ID from authentication context
        Long currentUserId = authService.getCurrentUserId();

        try {
            // Create payment intent with Stripe
            Map<String, Object> params = new HashMap<>();
            params.put("amount", request.getAmount().multiply(new BigDecimal("100")).intValue()); // Convert to cents
            params.put("currency", "usd");
            params.put("payment_method_types", Collections.singletonList("card"));

            PaymentIntent paymentIntent = PaymentIntent.create(params);

            // Create new payment in our database
            Payment payment = new Payment();
            payment.setOrderId(request.getOrderId());
            payment.setCustomerId(currentUserId);
            payment.setAmount(request.getAmount());
            payment.setPaymentMethod(request.getPaymentMethod());
            payment.setPaymentStatus("pending");

            // Save the Stripe payment ID for reference
            payment.setStripePaymentId(paymentIntent.getId());

            Payment savedPayment = paymentRepository.save(payment);

            // Create a response with payment details including client secret
            PaymentDTO dto = convertToPaymentDTO(savedPayment);
            dto.setClientSecret(paymentIntent.getClientSecret());

            return dto;
        } catch (StripeException e) {
            throw new RuntimeException("Error creating payment with Stripe: " + e.getMessage(), e);
        }
    }
}
