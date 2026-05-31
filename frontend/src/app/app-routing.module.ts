import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'customer',
    canActivate: [authGuard],
    loadChildren: () => import('./features/customer/customer.module').then((m) => m.CustomerModule),
  },
  {
    path: 'seller',
    canActivate: [authGuard],
    loadChildren: () => import('./features/seller/seller.module').then((m) => m.SellerModule),
  },
  { path: '', pathMatch: 'full', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
