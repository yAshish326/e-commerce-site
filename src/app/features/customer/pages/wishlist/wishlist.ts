import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { WishlistItem } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { UiService } from '../../../../shared/services/ui.service';

@Component({
  selector: 'app-wishlist',
  standalone: false,
  templateUrl: './wishlist.html',
  styleUrl: './wishlist.scss',
})
export class Wishlist implements OnInit, OnDestroy {
  items: WishlistItem[] = [];
  private subscription?: Subscription;
  private authSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly cartService: CartService,
    private readonly ui: UiService,
    private readonly cdr: ChangeDetectorRef, // ← add this
  ) {}

  get totalValue(): number {
    return this.items.reduce((sum, item) => sum + item.product.price, 0);
  }

  get itemCount(): number {
    return this.items.length;
  }

  ngOnInit(): void {
    this.authSub = this.authService.authState$.subscribe((user) => {
      this.subscription?.unsubscribe();

      if (!user) {
        this.items = [];
        this.cdr.markForCheck(); // ← add this
        return;
      }

      this.subscription = this.cartService.watchWishlist(user.uid).subscribe((items) => {
        this.items = items;
        this.cdr.markForCheck(); // ← add this
      });
    });
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.subscription?.unsubscribe();
  }

  async remove(item: WishlistItem): Promise<void> {
    if (!item.id) return;
    await this.cartService.removeFromWishlist(item.id);
  }

  async moveToCart(item: WishlistItem): Promise<void> {
    const uid = await this.authService.getCurrentUidAsync();
    if (!uid || !item.id) return;
    await this.cartService.addToCart(uid, item.product);
    await this.cartService.removeFromWishlist(item.id);
    this.ui.toast('Moved to cart');
  }
}