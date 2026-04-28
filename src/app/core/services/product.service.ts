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
  private static readonly DEFAULT_ASSET_IMAGE = 'assets/products/default-lucide.svg';
  private static readonly CATEGORY_FALLBACKS: Record<string, string> = {
    electronics: 'assets/products/fitness-band.svg',
    fashion: 'assets/products/backpack.svg',
    grocery: 'assets/products/coffee.svg',
    home: 'assets/products/lamp.svg',
    books: 'assets/products/book.svg',
    sports: 'assets/products/yoga-mat.svg',
    beauty: 'assets/products/beauty.svg',
    office: 'assets/products/office.svg',
    kitchen: 'assets/products/kitchen.svg',
    toys: 'assets/products/toys.svg',
    'pet care': 'assets/products/petcare.svg',
    stationery: 'assets/products/stationery.svg',
    health: 'assets/products/health.svg',
    travel: 'assets/products/travel.svg',
  };

  readonly categories = [
    'Electronics',
    'Fashion',
    'Grocery',
    'Home',
    'Books',
    'Sports',
    'Beauty',
    'Office',
    'Kitchen',
    'Toys',
    'Pet Care',
    'Stationery',
    'Health',
    'Travel',
  ];

  watchProducts(): Observable<Product[]> {
    return new Observable<Product[]>((subscriber) => {
      const unsub = onSnapshot(collection(firestore, 'products'), (snapshot) => {
        this.ngZone.run(() => {
          const firestoreItems = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Product),
            imageUrl: this.toAssetImageUrl(d.data() as Product),
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
            const data = snapshot.data() as Product;
            subscriber.next({
              id: snapshot.id,
              ...data,
              imageUrl: this.toAssetImageUrl(data),
            });
            return;
          }

          const fallback = DEMO_PRODUCTS.find((p) => p.id === productId);
          subscriber.next(
            fallback ? { ...fallback, imageUrl: this.toAssetImageUrl(fallback) } : null,
          );
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
            imageUrl: this.toAssetImageUrl(d.data() as Product),
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

  async addProduct(
    product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<void> {
    const timestamp = Date.now();

    const imageUrl = this.toAssetImageUrl(product);

    await addDoc(collection(firestore, 'products'), {
      ...product,
      imageUrl,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  async updateProduct(
    productId: string,
    payload: Partial<Omit<Product, 'id' | 'createdAt' | 'sellerId'>>,
    sellerId: string,
  ): Promise<void> {
    const imageUrl = this.toAssetImageUrl(payload);

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
      const fallback = DEMO_PRODUCTS.find((p) => p.id === productId);
      return fallback ? { ...fallback, imageUrl: this.toAssetImageUrl(fallback) } : null;
    }

    const data = snapshot.data() as Product;
    return {
      id: snapshot.id,
      ...data,
      imageUrl: this.toAssetImageUrl(data),
    };
  }

  private toAssetImageUrl(product: Partial<Product>): string {
    const raw = (product.imageUrl ?? '').trim();

    if (raw) {
      const normalized = raw
        .replaceAll('\\', '/')
        .replace(/^\.\//, '')
        .replace(/^\//, '')
        .replace(/^src\//, '');

      if (normalized.startsWith('assets/')) {
        return normalized;
      }
    }

    const categoryKey = (product.category ?? '').trim().toLowerCase();
    return ProductService.CATEGORY_FALLBACKS[categoryKey] ?? ProductService.DEFAULT_ASSET_IMAGE;
  }
}