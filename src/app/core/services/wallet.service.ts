import { Injectable, NgZone, inject } from '@angular/core'; // ← add NgZone, inject
import { addDoc, collection, doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { Observable } from 'rxjs';
import { firestore } from '../firebase/firebase.client';
import { WalletTransaction } from '../models/app.models';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  private readonly ngZone = inject(NgZone); // ← add this

  watchBalance(uid: string): Observable<number> {
    return new Observable<number>((subscriber) => {
      const unsub = onSnapshot(doc(firestore, 'users', uid), (snapshot) => {
        this.ngZone.run(() => { // ← wrap here
          const walletBalance = Number(snapshot.data()?.['walletBalance'] ?? 0);
          subscriber.next(walletBalance);
        });
      });
      return () => unsub();
    });
  }

  async addMoney(uid: string, amount: number): Promise<void> {
    await this.updateBalance(uid, amount, 'credit', 'Wallet top-up');
  }

  async deductMoney(uid: string, amount: number): Promise<void> {
    await this.updateBalance(uid, -Math.abs(amount), 'debit', 'Order payment');
  }

  private async updateBalance(
    uid: string,
    delta: number,
    type: WalletTransaction['type'],
    note: string,
  ): Promise<void> {
    const userRef = doc(firestore, 'users', uid);
    await runTransaction(firestore, async (transaction) => {
      const current = await transaction.get(userRef);
      const balance = Number(current.data()?.['walletBalance'] ?? 0);
      const updated = Math.max(0, balance + delta);
      transaction.set(userRef, { walletBalance: updated }, { merge: true });
    });

    await addDoc(collection(firestore, 'walletTransactions'), {
      uid,
      type,
      amount: Math.abs(delta),
      note,
      createdAt: Date.now(),
    } as WalletTransaction);
  }
}