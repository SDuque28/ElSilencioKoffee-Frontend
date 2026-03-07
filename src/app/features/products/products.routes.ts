import type { Routes } from '@angular/router';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/products-page.component').then((m) => m.ProductsPageComponent),
  },
];
