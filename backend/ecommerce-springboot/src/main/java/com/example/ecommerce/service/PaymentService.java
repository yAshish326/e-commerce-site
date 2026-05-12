package com.example.ecommerce.service;

import com.example.ecommerce.dto.PaymentRequest;
import com.example.ecommerce.dto.PaymentResponse;
import com.example.ecommerce.model.OrderRecord;
import com.example.ecommerce.model.PaymentRecord;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;

    public PaymentService(PaymentRepository paymentRepository, OrderRepository orderRepository) {
        this.paymentRepository = paymentRepository;
        this.orderRepository = orderRepository;
    }

    public PaymentResponse process(PaymentRequest request) {
        OrderRecord order = orderRepository.findById(UUID.fromString(request.getOrderId()))
                .orElseThrow(() -> new IllegalArgumentException("Order not found"));

        PaymentRecord payment = new PaymentRecord();
        payment.setId(UUID.randomUUID().toString());
        payment.setOrderId(request.getOrderId());
        payment.setUid(request.getUid());
        payment.setPaymentMethod(request.getPaymentMethod());
        payment.setStatus("success");
        payment.setReferenceId("PAY-" + UUID.randomUUID().toString().substring(0, 8));
        payment.setCreatedAt(System.currentTimeMillis());
        paymentRepository.save(payment);

        order.setPaymentStatus("success");
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPaymentReferenceId(payment.getReferenceId());
        orderRepository.save(order);

        return new PaymentResponse(payment.getId(), payment.getOrderId(), payment.getReferenceId(), payment.getStatus());
    }

    public PaymentResponse verify(String paymentId) {
        PaymentRecord payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        return new PaymentResponse(payment.getId(), payment.getOrderId(), payment.getReferenceId(), payment.getStatus());
    }
}
