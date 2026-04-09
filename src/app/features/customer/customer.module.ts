import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { CustomerRoutingModule } from './customer-routing.module';
import { Customer } from './customer.component';
import { HomePageComponent } from './pages/home/home';
import { ProductsPageComponent } from './pages/products/products';
import { ProductDetail } from './pages/product-detail/product-detail';
import { Cart } from './pages/cart/cart';
import { Wishlist } from './pages/wishlist/wishlist';
import { Checkout } from './pages/checkout/checkout';
import { Payment } from './pages/payment/payment';
import { OrderHistory } from './pages/order-history/order-history';
import { CustomerProfilePageComponent } from './pages/profile/profile';

@NgModule({
  declarations: [
    Customer,
    HomePageComponent,
    ProductsPageComponent,
    ProductDetail,
    CustomerProfilePageComponent,
    Cart,
    Wishlist,
    Checkout,
    Payment,
    OrderHistory,
  ],
  imports: [SharedModule, CustomerRoutingModule],
})
export class CustomerModule {}
