import { Injectable, NgZone, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CartItem, Product, WishlistItem } from '../models/app.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly ngZone = inject(NgZone);
  private readonly http = inject(HttpClient);

  watchCart(uid: string): Observable<CartItem[]> {
    return this.http.get<CartItem[]>(`${environment.apiBaseUrl}/cart/${uid}`).pipe(
      map((items) => items.map((i) => ({ ...i, quantity: Number(i.quantity ?? 1) }))),
      catchError(() => of([])),
    );
  }

  watchWishlist(uid: string): Observable<WishlistItem[]> {
    return this.http.get<WishlistItem[]>(`${environment.apiBaseUrl}/wishlist/${uid}`).pipe(catchError(() => of([])));
  }

  async addToCart(uid: string, product: Product, quantity = 1): Promise<void> {
    const productId = product.id;
    if (!productId) {
      throw new Error('Product id missing');
    }

    const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;
    const productPayload = this.toProductPayload(product, productId);
    await this.http.post(`${environment.apiBaseUrl}/cart`, { uid, productId, quantity: safeQuantity, product: productPayload }).toPromise();
  }

  async updateCartQuantity(itemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await this.http.delete(`${environment.apiBaseUrl}/cart/${itemId}`).toPromise();
      return;
    }
    await this.http.put(`${environment.apiBaseUrl}/cart/${itemId}`, { quantity }).toPromise();
  }

  async removeFromCart(itemId: string): Promise<void> {
    await this.http.delete(`${environment.apiBaseUrl}/cart/${itemId}`).toPromise();
  }

  async clearCart(uid: string): Promise<void> {
    // no bulk clear endpoint; fetch and delete each
    const items = await this.http.get<CartItem[]>(`${environment.apiBaseUrl}/cart/${uid}`).toPromise();
    await Promise.all((items ?? []).map((it) => this.http.delete(`${environment.apiBaseUrl}/cart/${it.id}`).toPromise()));
  }

  async addToWishlist(uid: string, product: Product): Promise<void> {
    const productId = product.id;
    if (!productId) {
      throw new Error('Product id missing');
    }
    await this.http.post(`${environment.apiBaseUrl}/wishlist`, { uid, productId, product: this.toProductPayload(product, productId) }).toPromise();
  }

  async removeFromWishlist(itemId: string): Promise<void> {
    await this.http.delete(`${environment.apiBaseUrl}/wishlist/${itemId}`).toPromise();
  }

  private toProductPayload(product: Product, productId: string): Product {
    return {
      id: productId,
      name: product.name ?? '',
      price: Number(product.price ?? 0),
      quantity: Number(product.quantity ?? 0),
      category: product.category ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      sellerId: product.sellerId ?? '',
      createdAt: Number(product.createdAt ?? Date.now()),
      updatedAt: Number(product.updatedAt ?? Date.now()),
    };
  }
}
