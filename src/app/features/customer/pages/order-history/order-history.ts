import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Order } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-order-history',
  standalone: false,
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss',
})
export class OrderHistory implements OnInit, OnDestroy {
  orders: Order[] = [];
  private subscription?: Subscription;
  private authSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly orderService: OrderService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.authState$.subscribe((user) => {
      this.subscription?.unsubscribe();

      if (!user) {
        this.orders = [];
        this.cdr.markForCheck();
        return;
      }

      this.subscription = this.orderService
        .watchCustomerOrders(user.uid)
        .subscribe((orders) => {
          this.orders = orders;
          this.cdr.markForCheck();
        });
    });
  }

  get totalSpent(): number {
    return this.orders.reduce((sum, order) => sum + Number(order.amount ?? 0), 0);
  }

  get successfulOrdersCount(): number {
    return this.orders.filter((order) => order.paymentStatus === 'success').length;
  }

  get successRate(): number {
    if (!this.orders.length) {
      return 0;
    }
    return (this.successfulOrdersCount / this.orders.length) * 100;
  }

  getOrderItemCount(order: Order): number {
    return order.items.reduce((count, item) => count + Number(item.quantity ?? 0), 0);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(Math.round(Number(amount ?? 0)));
  }

  formatPercent(value: number): string {
    return `${Math.round(value)}%`;
  }

  getOrderStatusClass(status: Order['status']): string {
    return status === 'placed' ? 'badge placed' : 'badge failed';
  }

  getPaymentStatusClass(status: Order['paymentStatus']): string {
    if (status === 'success') {
      return 'badge success';
    }
    if (status === 'pending') {
      return 'badge pending';
    }
    return 'badge failed';
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.subscription?.unsubscribe();
  }
}