import type { Routes } from '@angular/router';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/register-page.component').then((m) => m.RegisterPageComponent),
  },
];
