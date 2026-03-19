import type { Routes } from '@angular/router';

export const CART_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/cart-route-entry.component').then((m) => m.CartRouteEntryComponent),
  },
];
