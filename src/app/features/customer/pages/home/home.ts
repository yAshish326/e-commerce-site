import { Component, inject } from '@angular/core';
import { combineLatest, map } from 'rxjs';
import { Product } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { UiService } from '../../../../shared/services/ui.service';
import { CustomerSearchService } from '../../services/customer-search.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePageComponent {
  private readonly productService = inject(ProductService);
  private readonly customerSearchService = inject(CustomerSearchService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);

  readonly featuredProducts$ = combineLatest([
    this.productService.watchProducts(),
    this.customerSearchService.query$,
    this.customerSearchService.category$,
    this.customerSearchService.sort$,
  ]).pipe(
    map(([items, query, category, sort]) => {
      const filtered = this.productService.filterAndSort(items, category, query, sort);
      return filtered.slice(0, 8);
    }),
  );

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.onerror = null;
    image.src = 'assets/Login.png';
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
}
