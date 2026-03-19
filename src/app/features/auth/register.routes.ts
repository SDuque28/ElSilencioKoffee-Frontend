import type { Routes } from '@angular/router';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    data: {
      mode: 'register',
    },
    loadComponent: () =>
      import('./components/auth-container.component').then((m) => m.AuthContainerComponent),
  },
];
