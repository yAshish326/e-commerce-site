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
    private readonly cdr: ChangeDetectorRef, // ← add this
  ) {}

  ngOnInit(): void {
    this.authSub = this.authService.authState$.subscribe((user) => {
      this.subscription?.unsubscribe();

      if (!user) {
        this.orders = [];
        this.cdr.markForCheck(); // ← add this
        return;
      }

      this.subscription = this.orderService
        .watchCustomerOrders(user.uid)
        .subscribe((orders) => {
          this.orders = orders;
          this.cdr.markForCheck(); // ← add this
        });
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.subscription?.unsubscribe();
  }
}