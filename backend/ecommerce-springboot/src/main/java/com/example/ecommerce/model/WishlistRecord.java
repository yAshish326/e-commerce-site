package com.example.ecommerce.model;

import jakarta.persistence.*;

@Entity
@Table(name = "wishlist_records")
public class WishlistRecord {
    @Id
    private String id;

    private String uid;
    private String productId;

    @Lob
    private String productJson;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public String getProductId() { return productId; }
    public void setProductId(String productId) { this.productId = productId; }
    public String getProductJson() { return productJson; }
    public void setProductJson(String productJson) { this.productJson = productJson; }
}
