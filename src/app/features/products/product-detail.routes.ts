import type { Routes } from '@angular/router';

export const PRODUCT_DETAIL_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/product-detail-page.component').then((m) => m.ProductDetailPageComponent),
  },
];
