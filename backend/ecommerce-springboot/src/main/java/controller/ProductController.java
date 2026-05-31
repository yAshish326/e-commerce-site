package controller;

import dto.ProductDto;
import service.ProductService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;

import java.util.List;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<List<ProductDto>> list() {
        return ResponseEntity.ok(productService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDto> get(@PathVariable String id) {
        return productService.get(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<List<ProductDto>> bySeller(@PathVariable String sellerId) {
        return ResponseEntity.ok(productService.listBySeller(sellerId));
    }

    @PostMapping
    public ResponseEntity<ProductDto> create(@Valid @RequestBody ProductDto dto) {
        ProductDto created = productService.create(dto);
        return ResponseEntity.created(URI.create("/api/products/" + created.getId())).body(created);
    }

    @PostMapping("/upload-image")
    public ResponseEntity<?> uploadImage(@RequestParam("file") MultipartFile file) throws Exception {
        String imagePath = productService.saveImage(file);
        return ResponseEntity.ok(java.util.Collections.singletonMap("imageUrl", imagePath));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDto> update(@PathVariable String id, @Valid @RequestBody ProductDto dto) {
        ProductDto updated = productService.update(id, dto);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        boolean removed = productService.delete(id);
        if (!removed) return ResponseEntity.notFound().build();
        return ResponseEntity.noContent().build();
    }
}
