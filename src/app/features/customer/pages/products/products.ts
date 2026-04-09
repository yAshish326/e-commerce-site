import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { Subject, Subscription, combineLatest, debounceTime, distinctUntilChanged, startWith } from 'rxjs';
import { Product } from '../../../../core/models/app.models';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../../core/services/cart.service';
import { ProductService } from '../../../../core/services/product.service';
import { UiService } from '../../../../shared/services/ui.service';
import { CustomerSearchService } from '../../services/customer-search.service';

@Component({
  selector: 'app-products',
  standalone: false,
  templateUrl: './products.html',
  styleUrl: './products.scss',
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly authService = inject(AuthService);
  private readonly ui = inject(UiService);
  private readonly cdr = inject(ChangeDetectorRef); // ← add this
  private readonly customerSearchService = inject(CustomerSearchService);

  readonly categories = ['All', ...this.productService.categories];

  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  pagedProducts: Product[] = [];

  selectedCategory = 'All';
  search = '';
  sort = 'latest';

  pageSize = 8;
  pageIndex = 0;

  private readonly subscriptions = new Subscription();

  ngOnInit(): void {
    // ✅ Fix 1 — combine ALL filter streams into ONE subscription
    // applyFilters() now runs only ONCE even if multiple values change
    this.subscriptions.add(
      combineLatest([
        this.productService.watchProducts(),
        this.customerSearchService.query$.pipe(
          debounceTime(300),        // ← Fix 2: wait 300ms after user stops typing
          distinctUntilChanged(),   // ← Fix 3: only emit if value actually changed
          startWith(''),
        ),
        this.customerSearchService.category$.pipe(
          distinctUntilChanged(),
          startWith('All'),
        ),
        this.customerSearchService.sort$.pipe(
          distinctUntilChanged(),
          startWith('latest'),
        ),
      ]).subscribe(([products, query, category, sort]) => {
        // All 4 values arrive together — applyFilters runs ONCE
        this.allProducts = products;
        this.search = query;
        this.selectedCategory = category;
        this.sort = sort;
        this.applyFilters();
        this.cdr.markForCheck(); // ← Fix 4: tell Angular to re-render
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  applyFilters(): void {
    this.filteredProducts = this.productService.filterAndSort(
      this.allProducts,
      this.selectedCategory,
      this.search,
      this.sort,
    );
    this.pageIndex = 0;
    this.updatePagedProducts();
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePagedProducts();
    this.cdr.markForCheck(); // ← add this
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
      this.ui.toast(
        error?.code
          ? `${error.code}: ${error?.message ?? ''}`
          : (error?.message ?? 'Could not add to cart')
      );
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

  private updatePagedProducts(): void {
    const start = this.pageIndex * this.pageSize;
    this.pagedProducts = this.filteredProducts.slice(start, start + this.pageSize);
  }
}