import { Injectable, NgZone, inject } from '@angular/core';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firestore } from '../firebase/firebase.client';
import { CartItem, Product, WishlistItem } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private readonly ngZone = inject(NgZone); // ← added

  watchCart(uid: string): Observable<CartItem[]> {
    const cartQuery = query(collection(firestore, 'cart'), where('uid', '==', uid));
    return new Observable<CartItem[]>((subscriber) => {
      const unsub = onSnapshot(
        cartQuery,
        (snapshot) => {
          this.ngZone.run(() => { // ← wrapped
            const items = snapshot.docs.map((d) => {
              const data = d.data() as Partial<CartItem>;
              return {
                ...(data as CartItem),
                id: d.id,
                quantity: Number(data.quantity ?? 1),
              } as CartItem;
            });
            subscriber.next(items);
          });
        },
        (error) => {
          console.error('watchCart error:', error);
          subscriber.error(error);
        },
      );
      return () => unsub();
    });
  }

  watchWishlist(uid: string): Observable<WishlistItem[]> {
    const wishlistQuery = query(collection(firestore, 'wishlist'), where('uid', '==', uid));
    return new Observable<WishlistItem[]>((subscriber) => {
      const unsub = onSnapshot(
        wishlistQuery,
        (snapshot) => {
          this.ngZone.run(() => { // ← wrapped
            const items = snapshot.docs.map((d) => ({
              ...(d.data() as WishlistItem),
              id: d.id,
            }));
            subscriber.next(items);
          });
        },
        (error) => {
          console.error('watchWishlist error:', error);
          subscriber.error(error);
        },
      );
      return () => unsub();
    });
  }

  async addToCart(uid: string, product: Product, quantity = 1): Promise<void> {
    const productId = product.id;
    if (!productId) {
      throw new Error('Product id missing');
    }

    const safeQuantity = Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1;

    const productPayload: Product = {
      id: productId,
      name: product.name ?? '',
      price: Number(product.price ?? 0),
      category: product.category ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      sellerId: product.sellerId ?? '',
      createdAt: Number(product.createdAt ?? Date.now()),
      updatedAt: Number(product.updatedAt ?? Date.now()),
    };

    const id = `${uid}_${productId}`;
    const ref = doc(firestore, 'cart', id);

    const snapshot = await getDoc(ref);
    const existingQty = Number(snapshot.data()?.['quantity'] ?? 0);
    const nextQty = Math.max(1, existingQty + safeQuantity);

    await setDoc(
      ref,
      { uid, productId, quantity: nextQty, product: productPayload },
      { merge: true },
    );
  }

  async updateCartQuantity(itemId: string, quantity: number): Promise<void> {
    if (quantity <= 0) {
      await deleteDoc(doc(firestore, 'cart', itemId));
      return;
    }
    await setDoc(doc(firestore, 'cart', itemId), { quantity }, { merge: true });
  }

  async removeFromCart(itemId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'cart', itemId));
  }

  async clearCart(uid: string): Promise<void> {
    const cartQuery = query(collection(firestore, 'cart'), where('uid', '==', uid));
    const docs = await getDocs(cartQuery);
    await Promise.all(docs.docs.map((item) => deleteDoc(doc(firestore, 'cart', item.id))));
  }

  async addToWishlist(uid: string, product: Product): Promise<void> {
    const productId = product.id;
    if (!productId) {
      throw new Error('Product id missing');
    }

    const productPayload: Product = {
      id: productId,
      name: product.name ?? '',
      price: Number(product.price ?? 0),
      category: product.category ?? '',
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      sellerId: product.sellerId ?? '',
      createdAt: Number(product.createdAt ?? Date.now()),
      updatedAt: Number(product.updatedAt ?? Date.now()),
    };

    const id = `${uid}_${productId}`;
    await setDoc(
      doc(firestore, 'wishlist', id),
      { uid, productId, product: productPayload },
      { merge: true }, // ← also fixed missing merge
    );
  }

  async removeFromWishlist(itemId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'wishlist', itemId));
  }
}