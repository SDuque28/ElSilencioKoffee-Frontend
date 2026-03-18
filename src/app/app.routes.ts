import type { Routes } from '@angular/router';

import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/login.routes').then((m) => m.LOGIN_ROUTES),
  },
  {
    path: 'register',
    loadChildren: () => import('./features/auth/register.routes').then((m) => m.REGISTER_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    data: { layout: 'public' },
    children: [
      {
        path: '',
        loadChildren: () => import('./features/store/store.routes').then((m) => m.STORE_ROUTES),
      },
      {
        path: 'products',
        loadChildren: () =>
          import('./features/products/products.routes').then((m) => m.PRODUCT_ROUTES),
      },
      {
        path: 'product',
        loadChildren: () =>
          import('./features/products/product-detail.routes').then((m) => m.PRODUCT_DETAIL_ROUTES),
      },
      {
        path: 'cart',
        canActivate: [authGuard],
        loadChildren: () => import('./features/cart/cart.routes').then((m) => m.CART_ROUTES),
      },
      {
        path: 'orders',
        canActivate: [authGuard],
        loadChildren: () => import('./features/orders/orders.routes').then((m) => m.ORDER_ROUTES),
      },
    ],
  },
  {
    path: 'dashboard',
    component: MainLayoutComponent,
    data: { layout: 'admin' },
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
