package com.example.ecommerce.repository;

import com.example.ecommerce.model.WishlistRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WishlistRepository extends JpaRepository<WishlistRecord, String> {
    List<WishlistRecord> findByUid(String uid);
}
