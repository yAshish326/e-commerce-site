package com.example.ecommerce.controller;

import com.example.ecommerce.model.WishlistRecord;
import com.example.ecommerce.repository.WishlistRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/wishlist")
public class WishlistController {

    private final WishlistRepository repo;

    public WishlistController(WishlistRepository repo) { this.repo = repo; }

    @GetMapping("/{uid}")
    public ResponseEntity<List<WishlistRecord>> getByUser(@PathVariable String uid) {
        return ResponseEntity.ok(repo.findByUid(uid));
    }

    @PostMapping
    public ResponseEntity<WishlistRecord> create(@RequestBody WishlistRecord r) {
        if (r.getId() == null) r.setId(java.util.UUID.randomUUID().toString());
        return ResponseEntity.ok(repo.save(r));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
