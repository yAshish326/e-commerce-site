package controller;

import model.OrderRecord;
import repository.OrderRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrdersController {

    private final OrderRepository repo;

    public OrdersController(OrderRepository repo) { this.repo = repo; }

    @GetMapping("/{uid}")
    public ResponseEntity<List<OrderRecord>> listByUser(@PathVariable String uid) {
        return ResponseEntity.ok(repo.findByUid(uid));
    }

    @PostMapping
    public ResponseEntity<OrderRecord> create(@RequestBody OrderRecord r) {
        if (r.getId() == null) r.setId(UUID.randomUUID());
        r.setCreatedAt(System.currentTimeMillis());
        OrderRecord saved = repo.save(r);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<OrderRecord> getById(@PathVariable UUID id) {
        return repo.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }
}
