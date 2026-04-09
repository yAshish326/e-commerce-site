import { Injectable, NgZone, inject } from '@angular/core';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { DEMO_PRODUCTS } from '../data/demo-products';
import { firestore } from '../firebase/firebase.client';
import { Product } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly ngZone = inject(NgZone);

  readonly categories = ['Electronics', 'Fashion', 'Grocery', 'Home', 'Books', 'Sports'];

  watchProducts(): Observable<Product[]> {
    return new Observable<Product[]>((subscriber) => {
      const unsub = onSnapshot(collection(firestore, 'products'), (snapshot) => {
        this.ngZone.run(() => {
          const firestoreItems = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Product),
          }));

          const firestoreIds = new Set(
            firestoreItems.map(p => p.id).filter((id): id is string => !!id)
          );

          const missingDemos = DEMO_PRODUCTS.filter(
            p => p.id && !firestoreIds.has(p.id)
          );

          const allProducts = [...firestoreItems, ...missingDemos];
          allProducts.sort((a, b) => b.createdAt - a.createdAt);

          subscriber.next(allProducts);
        });
      });
      return () => unsub();
    });
  }

  watchProduct(productId: string): Observable<Product | null> {
    return new Observable<Product | null>((subscriber) => {
      const unsub = onSnapshot(doc(firestore, 'products', productId), (snapshot) => {
        this.ngZone.run(() => {
          if (snapshot.exists()) {
            subscriber.next({ id: snapshot.id, ...(snapshot.data() as Product) });
            return;
          }
          subscriber.next(DEMO_PRODUCTS.find((p) => p.id === productId) ?? null);
        });
      });
      return () => unsub();
    });
  }

  watchSellerProducts(sellerId: string): Observable<Product[]> {
    const productsQuery = query(
      collection(firestore, 'products'),
      where('sellerId', '==', sellerId),
    );
    return new Observable<Product[]>((subscriber) => {
      const unsub = onSnapshot(productsQuery, (snapshot) => {
        this.ngZone.run(() => {
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Product),
          }));
          items.sort((a, b) => b.createdAt - a.createdAt);
          subscriber.next(items);
        });
      });
      return () => unsub();
    });
  }

  filterAndSort(
    products: Product[],
    category: string,
    search: string,
    sort: string,
  ): Product[] {
    let output = [...products];
    if (category && category !== 'All') {
      output = output.filter((p) => p.category === category);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      output = output.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.description.toLowerCase().includes(term),
      );
    }
    if (sort === 'priceAsc') {
      output.sort((a, b) => a.price - b.price);
    } else if (sort === 'priceDesc') {
      output.sort((a, b) => b.price - a.price);
    } else {
      output.sort((a, b) => b.createdAt - a.createdAt);
    }
    return output;
  }

  // ✅ Added inlineImageUrl as 3rd param — matches what product-form.ts passes
  async addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'imageUrl'>,
    file?: File,
    inlineImageUrl?: string,
  ): Promise<void> {
    const timestamp = Date.now();

    // Use base64 inline image if provided, otherwise empty string
    const imageUrl = inlineImageUrl ?? '';

    await addDoc(collection(firestore, 'products'), {
      ...product,
      imageUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  // ✅ Added inlineImageUrl as 5th param — matches what product-form.ts passes
  async updateProduct(
    productId: string,
    payload: Partial<Omit<Product, 'id' | 'createdAt' | 'sellerId'>>,
    sellerId: string,
    file?: File,
    inlineImageUrl?: string,
  ): Promise<void> {
    // Use new inline image if provided, otherwise keep existing imageUrl
    const imageUrl = inlineImageUrl ?? payload.imageUrl ?? '';

    await setDoc(
      doc(firestore, 'products', productId),
      { ...payload, imageUrl, updatedAt: Date.now() },
      { merge: true },
    );
  }

  async deleteProduct(productId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'products', productId));
  }

  async getProductSnapshot(productId: string): Promise<Product | null> {
    const snapshot = await getDoc(doc(firestore, 'products', productId));
    if (!snapshot.exists()) {
      return DEMO_PRODUCTS.find((p) => p.id === productId) ?? null;
    }
    return { id: snapshot.id, ...(snapshot.data() as Product) };
  }
}