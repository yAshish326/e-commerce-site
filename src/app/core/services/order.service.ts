import { Injectable, NgZone, inject } from '@angular/core';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firestore } from '../firebase/firebase.client';
import { Order } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly ngZone = inject(NgZone); // ← added

  async placeOrder(order: Omit<Order, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(collection(firestore, 'orders'), {
      ...order,
      createdAt: Date.now(),
    });
    return ref.id;
  }

  watchCustomerOrders(uid: string): Observable<Order[]> {
    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('uid', '==', uid),
    );
    return this.streamOrders(ordersQuery);
  }

  watchSellerOrders(sellerId: string): Observable<Order[]> {
    const ordersQuery = query(
      collection(firestore, 'orders'),
      where('sellerIds', 'array-contains', sellerId),
    );
    return this.streamOrders(ordersQuery);
  }

  private streamOrders(
    ordersQuery: ReturnType<typeof query>,
  ): Observable<Order[]> {
    return new Observable<Order[]>((subscriber) => {
      const unsub = onSnapshot(ordersQuery, (snapshot) => {
        this.ngZone.run(() => { // ← wrapped
          const items = snapshot.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Order),
          }));
          items.sort((a, b) => b.createdAt - a.createdAt);
          subscriber.next(items);
        });
      });
      return () => unsub();
    });
  }
}