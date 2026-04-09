import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CartItem, Order, Product } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit, OnDestroy {
  private readonly currencyFormatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

  sellerId = '';
  products: Product[] = [];
  orders: Order[] = [];

  private productsSub?: Subscription;
  private ordersSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly productService: ProductService,
    private readonly orderService: OrderService,
  ) {}

  get sellerOrders(): Order[] {
    return this.orders
      .filter((order) => this.getSellerItems(order).length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  get ordersToday(): number {
    const startOfDay = this.getStartOfDayTimestamp();
    return this.sellerOrders.filter((order) => order.createdAt >= startOfDay).length;
  }

  get successfulPaymentsCount(): number {
    return this.sellerOrders.filter((order) => order.paymentStatus === 'success').length;
  }

  get pendingPaymentsCount(): number {
    return this.sellerOrders.filter((order) => order.paymentStatus === 'pending').length;
  }

  get failedPaymentsCount(): number {
    return this.sellerOrders.filter((order) => order.paymentStatus === 'failed').length;
  }

  get totalRevenue(): number {
    return this.sellerOrders
      .filter((order) => order.paymentStatus === 'success')
      .reduce((sum, order) => sum + this.getSellerOrderTotal(order), 0);
  }

  get todayRevenue(): number {
    const startOfDay = this.getStartOfDayTimestamp();
    return this.sellerOrders
      .filter((order) => order.paymentStatus === 'success' && order.createdAt >= startOfDay)
      .reduce((sum, order) => sum + this.getSellerOrderTotal(order), 0);
  }

  get pendingRevenue(): number {
    return this.sellerOrders
      .filter((order) => order.paymentStatus === 'pending')
      .reduce((sum, order) => sum + this.getSellerOrderTotal(order), 0);
  }

  get averageOrderValue(): number {
    const paidOrders = this.sellerOrders.filter((order) => order.paymentStatus === 'success');
    if (paidOrders.length === 0) {
      return 0;
    }
    return paidOrders.reduce((sum, order) => sum + this.getSellerOrderTotal(order), 0) / paidOrders.length;
  }

  get totalUnitsSold(): number {
    return this.sellerOrders.reduce((sum, order) => {
      const unitsInOrder = this.getSellerItems(order).reduce((itemsSum, item) => itemsSum + item.quantity, 0);
      return sum + unitsInOrder;
    }, 0);
  }

  get productsMissingImage(): number {
    return this.products.filter((product) => !product.imageUrl?.trim()).length;
  }

  get staleProducts(): number {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.products.filter((product) => product.updatedAt < sevenDaysAgo).length;
  }

  get recentOrders(): Array<{
    id: string;
    createdAt: number;
    status: Order['status'];
    paymentStatus: Order['paymentStatus'];
    customer: string;
    items: number;
    total: number;
  }> {
    return this.sellerOrders.slice(0, 6).map((order) => {
      const sellerItems = this.getSellerItems(order);
      return {
        id: order.id ?? '-',
        createdAt: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        customer: order.address?.fullName || 'Customer',
        items: sellerItems.reduce((sum, item) => sum + item.quantity, 0),
        total: this.getSellerOrderTotal(order),
      };
    });
  }

  get topProducts(): Array<{ name: string; units: number; revenue: number }> {
    const aggregate = new Map<string, { name: string; units: number; revenue: number }>();

    for (const order of this.sellerOrders) {
      for (const item of this.getSellerItems(order)) {
        const key = item.productId;
        const current = aggregate.get(key) ?? {
          name: item.product.name,
          units: 0,
          revenue: 0,
        };
        current.units += item.quantity;
        current.revenue += item.quantity * item.product.price;
        aggregate.set(key, current);
      }
    }

    return Array.from(aggregate.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  formatCurrency(value: number): string {
    return this.currencyFormatter.format(Math.round(value));
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  ngOnInit(): void {
    const uid = this.authService.getCurrentUid();
    if (!uid) {
      return;
    }

    this.sellerId = uid;

    this.productsSub = this.productService
      .watchSellerProducts(uid)
      .subscribe((products) => (this.products = products));

    this.ordersSub = this.orderService.watchSellerOrders(uid).subscribe((orders) => (this.orders = orders));
  }

  ngOnDestroy(): void {
    this.productsSub?.unsubscribe();
    this.ordersSub?.unsubscribe();
  }

  private getSellerItems(order: Order): CartItem[] {
    return order.items.filter((item) => item.product.sellerId === this.sellerId);
  }

  private getSellerOrderTotal(order: Order): number {
    return this.getSellerItems(order).reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }

  private getStartOfDayTimestamp(): number {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return startOfDay.getTime();
  }
}
