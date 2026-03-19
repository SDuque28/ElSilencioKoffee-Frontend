import type { Routes } from '@angular/router';

export const PRODUCT_DETAIL_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./components/product-route-entry.component').then((m) => m.ProductRouteEntryComponent),
  },
];
