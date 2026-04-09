import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';

import { SellerRoutingModule } from './seller-routing.module';
import { Seller } from './seller.component';
import { Dashboard } from './pages/dashboard/dashboard';
import { ProductForm } from './pages/product-form/product-form';
import { Orders } from './pages/orders/orders';

@NgModule({
  declarations: [Seller, Dashboard, ProductForm, Orders],
  imports: [SharedModule, SellerRoutingModule],
})
export class SellerModule {}
