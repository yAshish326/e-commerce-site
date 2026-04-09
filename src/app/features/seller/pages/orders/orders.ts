import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { Order } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';

@Component({
  selector: 'app-orders',
  standalone: false,
  templateUrl: './orders.html',
  styleUrl: './orders.scss',
})
export class Orders implements OnInit, OnDestroy {
  orders: Order[] = [];
  private subscription?: Subscription;

  constructor(private readonly authService: AuthService, private readonly orderService: OrderService) {}

  ngOnInit(): void {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return;
    }

    this.subscription = this.orderService.watchSellerOrders(uid).subscribe((orders) => (this.orders = orders));
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
