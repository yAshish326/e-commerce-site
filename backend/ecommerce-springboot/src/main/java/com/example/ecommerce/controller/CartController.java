package com.example.ecommerce.controller;

import com.example.ecommerce.model.CartRecord;
import com.example.ecommerce.repository.CartRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    private final CartRepository cartRepository;

    public CartController(CartRepository cartRepository) {
        this.cartRepository = cartRepository;
    }

    @GetMapping("/{uid}")
    public ResponseEntity<List<CartRecord>> getByUser(@PathVariable String uid) {
        return ResponseEntity.ok(cartRepository.findByUid(uid));
    }

    @PostMapping
    public ResponseEntity<CartRecord> create(@RequestBody CartRecord rec) {
        if (rec.getId() == null) rec.setId(java.util.UUID.randomUUID().toString());
        CartRecord saved = cartRepository.save(rec);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        cartRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
