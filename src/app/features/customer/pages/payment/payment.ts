import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Order } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { WalletService } from '../../../../core/services/wallet.service';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-payment',
  standalone: false,
  templateUrl: './payment.html',
  styleUrl: './payment.scss',
})
export class Payment {
  readonly orderDraft = history.state?.['orderDraft'] as
    | Omit<Order, 'id' | 'createdAt' | 'status' | 'paymentStatus'>
    | undefined;

  paymentResult: 'success' | 'failed' | null = null;

  constructor(
    private readonly orderService: OrderService,
    private readonly cartService: CartService,
    private readonly walletService: WalletService, // ← added
    private readonly authService: AuthService,     // ← added
    private readonly ui: UiService,
    private readonly router: Router,
  ) {}

  async processPayment(force: 'success' | 'failed' | 'random'): Promise<void> {
    if (!this.orderDraft) {
      this.ui.toast('No order found. Start checkout again.');
      await this.router.navigate(['/customer/cart']);
      return;
    }

    this.ui.setLoading(true);
    try {
      const result =
        force === 'random'
          ? Math.random() > 0.3
            ? 'success'
            : 'failed'
          : force;

      this.paymentResult = result;

      await this.orderService.placeOrder({
        ...this.orderDraft,
        status: result === 'success' ? 'placed' : 'failed',
        paymentStatus: result,
      });

      if (result === 'success') {
        // ✅ Deduct wallet balance
        await this.walletService.deductMoney(
          this.orderDraft.uid,
          this.orderDraft.amount * 1.1, // total including tax
        );
        // ✅ Clear cart
        await this.cartService.clearCart(this.orderDraft.uid);
      }

      this.ui.toast(`Payment ${result}`);
      await this.router.navigate(['/customer/orders']);
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Payment failed');
    } finally {
      this.ui.setLoading(false);
    }
  }
}