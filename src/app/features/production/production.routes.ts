import type { Routes } from '@angular/router';

export const PRODUCTION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/production-page.component').then((m) => m.ProductionPageComponent),
  },
];
