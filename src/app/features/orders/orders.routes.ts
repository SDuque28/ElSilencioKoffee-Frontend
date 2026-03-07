import type { Routes } from '@angular/router';

export const ORDER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/orders-page.component').then((m) => m.OrdersPageComponent),
  },
];
