import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { Product } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-product-detail',
  standalone: false,
  templateUrl: './product-detail.html',
  styleUrl: './product-detail.scss',
})
export class ProductDetail implements OnInit, OnDestroy {
  product: Product | null = null;
  quantity = 1;
  isNotFound = false;

  private subscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly authService: AuthService,
    private readonly ui: UiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isNotFound = true;
      return;
    }
    this.subscription = this.productService.watchProduct(id).subscribe((product) => {
      this.product = product;
      this.isNotFound = !product;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    this.quantity = this.quantity + 1;
  }

  onQuantityChange(value: string | number): void {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      this.quantity = 1;
      return;
    }

    this.quantity = Math.max(1, Math.floor(parsed));
  }

  async addToCart(): Promise<void> {
    const uid = await this.authService.getCurrentUidAsync();
    if (!uid || !this.product) {
      this.ui.toast('Please login first');
      return;
    }
    try {
      await this.cartService.addToCart(uid, this.product, this.quantity);
      this.ui.toast('Added to cart');
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Could not add to cart');
    }
  }

  async addToWishlist(): Promise<void> {
    const uid = this.authService.getCurrentUid();
    if (!uid || !this.product) {
      this.ui.toast('Please login first');
      return;
    }
    try {
      await this.cartService.addToWishlist(uid, this.product);
      this.ui.toast('Added to wishlist');
    } catch (error: any) {
      this.ui.toast(error?.message ?? 'Could not add to wishlist');
    }
  }
}