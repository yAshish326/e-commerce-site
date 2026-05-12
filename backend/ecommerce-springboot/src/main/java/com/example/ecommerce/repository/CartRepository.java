package com.example.ecommerce.repository;

import com.example.ecommerce.model.CartRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CartRepository extends JpaRepository<CartRecord, String> {
    List<CartRecord> findByUid(String uid);
}
