import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { combineLatest, map, of, switchMap } from 'rxjs';
import { Order, Product, UserProfile, WishlistItem } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { OrderService } from '../../../../core/services/order.service';
import { ProductService } from '../../../../core/services/product.service';
import { WalletService } from '../../../../core/services/wallet.service';
import { UiService } from '../../../../shared/services/ui.service';
import { CustomerSearchService } from '../../services/customer-search.service';
import { environment } from '../../../../../environments/environment';

interface DashboardOrderCard {
  id: string;
  title: string;
  subtitle: string;
  createdAt: number;
  amount: number;
  itemCount: number;
  statusLabel: string;
  statusClass: string;
}

interface DashboardWishlistCard {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
}

interface DashboardProductCard {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl: string;
  rating: string;
  reviewCount: number;
}

interface DashboardViewModel {
  displayName: string;
  initial: string;
  avatarUrl: string;
  walletBalance: number;
  totalOrders: number;
  completedOrders: number;
  wishlistCount: number;
  cartCount: number;
  availableCoupons: number;
  recentOrders: DashboardOrderCard[];
  wishlistItems: DashboardWishlistCard[];
  recommendedProducts: DashboardProductCard[];
}

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly customerSearchService = inject(CustomerSearchService);
  private readonly cartService = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly walletService = inject(WalletService);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);

  readonly chips = ['All', 'Electronics', 'Fashion', 'Home', 'Best Price', 'Popular'];
  activeChip = 'All';
  readonly defaultProductImageUrl = '/assets/products/default-lucide.svg';

  readonly dashboard$ = this.authService.authState$.pipe(
    switchMap((user) => {
      if (!user) {
        return of(this.buildEmptyDashboard());
      }

      const uid = user.uid;

      return combineLatest([
        this.authService.profile$,
        this.walletService.watchBalance(uid),
        this.orderService.watchCustomerOrders(uid),
        this.cartService.watchCart(uid),
        this.cartService.watchWishlist(uid),
        this.productService.watchProducts(),
        this.customerSearchService.query$,
        this.customerSearchService.category$,
        this.customerSearchService.sort$,
      ]).pipe(
        map(([profile, walletBalance, orders, cartItems, wishlistItems, products, query, category, sort]) => {
          const filteredProducts = this.productService.filterAndSort(products, category, query, sort);
          const displayName = this.buildDisplayName(profile, user.displayName ?? user.email ?? null);

          return {
            displayName,
            initial: this.buildInitial(displayName),
            avatarUrl: this.normalizePhotoUrl(profile?.photoURL),
            walletBalance,
            totalOrders: orders.length,
            completedOrders: orders.filter((order) => order.status === 'placed' && order.paymentStatus === 'success').length,
             wishlistCount: wishlistItems.length,
            cartCount: cartItems.length,
            availableCoupons: 3,
            recentOrders: orders.slice(0, 4).map((order) => this.mapOrder(order)),
            wishlistItems: wishlistItems.slice(0, 5).map((item) => this.mapWishlistItem(item, products)),
            recommendedProducts: filteredProducts.slice(0, 6).map((product, index) => this.mapProduct(product, index)),
          } satisfies DashboardViewModel;
        }),
      );
    }),
  );

  readonly featuredProducts$ = combineLatest([
    this.productService.watchProducts(),
    this.customerSearchService.query$,
    this.customerSearchService.category$,
    this.customerSearchService.sort$,
  ]).pipe(
    map(([items, query, category, sort]) => {
      return this.productService.filterAndSort(items, category, query, sort);
    }),
  );

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = this.defaultProductImageUrl;
  }

  selectChip(chip: string): void {
    this.activeChip = chip;

    if (chip === 'Best Price') {
      this.customerSearchService.setCategory('All');
      this.customerSearchService.setSort('priceAsc');
      return;
    }

    if (chip === 'Popular') {
      this.customerSearchService.setCategory('All');
      this.customerSearchService.setSort('priceDesc');
      return;
    }

    this.customerSearchService.setCategory(chip);
    this.customerSearchService.setSort('latest');
  }

  async addToCart(product: Product): Promise<void> {
    const uid = await this.authService.getCurrentUidAsync();
    if (!uid) {
      this.ui.toast('Please login first');
      return;
    }

    try {
      await this.cartService.addToCart(uid, product, 1);
      this.ui.toast('Added to cart');
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Could not add to cart');
    }
  }

  async addToWishlist(product: Product): Promise<void> {
    const uid = await this.authService.getCurrentUidAsync();
    if (!uid) {
      this.ui.toast('Please login first');
      return;
    }

    try {
      await this.cartService.addToWishlist(uid, product);
      this.ui.toast('Added to wishlist');
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Could not add to wishlist');
    }
  }

  async addRecommendedToCart(product: DashboardProductCard): Promise<void> {
    await this.addToCart(this.toProduct(product));
  }

  async addRecommendedToWishlist(product: DashboardProductCard): Promise<void> {
    await this.addToWishlist(this.toProduct(product));
  }

  openProductDetail(productId: string | null | undefined): void {
    if (!productId) {
      return;
    }

    void this.router.navigate(['/customer/products', productId]);
  }
  private buildEmptyDashboard(): DashboardViewModel {
    const fallbackName = 'Customer';

    return {
      displayName: fallbackName,
      initial: fallbackName.slice(0, 2).toUpperCase(),
         avatarUrl: 'assets/products/Login.png',
      walletBalance: 0,
      totalOrders: 0,
      completedOrders: 0,
      wishlistCount: 0,
      cartCount: 0,
      availableCoupons: 0,
      recentOrders: [],
      wishlistItems: [],
      recommendedProducts: [],
    };
  }

  private mapOrder(order: Order): DashboardOrderCard {
    const itemCount = (order.items || []).reduce((s, it) => s + Number(it.quantity ?? 0), 0);
    const title = order.items?.[0]?.product?.name ?? `Order ${order.id ?? ''}`;
    const subtitle = `${itemCount} item${itemCount === 1 ? '' : 's'} • ${new Date(order.createdAt).toLocaleDateString()}`;

    return {
      id: order.id ?? String(order.createdAt),
      title,
      subtitle,
      createdAt: order.createdAt,
      amount: order.amount ?? 0,
      itemCount,
      statusLabel: order.status ?? 'Delivered',
      statusClass: order.status === 'canceled' ? 'status-canceled' : 'status-success',
    };
  }

  private mapWishlistItem(item: WishlistItem, products: Product[]): DashboardWishlistCard {
    const productFromList = products.find((p) => p.id === item.productId);
    const source = productFromList ?? item.product;
    return {
      id: item.id ?? item.productId,
      name: source?.name ?? 'Product',
      category: source?.category ?? '',
      price: source?.price ?? 0,
      imageUrl: this.productService.resolveImageUrl(source ?? item.product),
    };
  }

  private mapProduct(product: Product, index: number): DashboardProductCard {
    return {
      id: product.id ?? `${product.name}-${product.createdAt}`,
      name: product.name,
      category: product.category,
      price: product.price,
      imageUrl: this.productService.resolveImageUrl(product),
      rating: '4.5',
      reviewCount: 10,
    };
  }

  private toProduct(product: DashboardProductCard): Product {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      category: product.category,
      description: '',
      imageUrl: product.imageUrl,
      sellerId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  private normalizePhotoUrl(url: string | undefined): string {
    const v = (url ?? '').trim();
    if (!v) return 'assets/products/Login.png';
    if (v.startsWith('data:') || v.startsWith('http')) return v;
    const normalized = v.replaceAll('\\', '/').replace(/^\.?\//, '').replace(/^src\//, '');
       return normalized.startsWith('assets/') ? normalized : 'assets/products/Login.png';
  }

  private buildDisplayName(profile: UserProfile | null, authName: string | null): string {
    if (profile?.displayName?.trim()) return profile.displayName.trim();
    if (authName?.trim()) return authName.includes('@') ? authName.split('@')[0] : authName.trim();
    if (profile?.email?.trim()) return profile.email.split('@')[0];
    return 'Customer';
  }

  private buildInitial(name: string): string {
    return name.trim().replace(/\s+/g, '').slice(0, 2).toUpperCase() || 'C';
  }
}
