package com.example.ecommerce.repository;

import com.example.ecommerce.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<PaymentRecord, String> {
}
