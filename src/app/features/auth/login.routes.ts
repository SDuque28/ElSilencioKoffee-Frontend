import type { Routes } from '@angular/router';

export const LOGIN_ROUTES: Routes = [
  {
    path: '',
    data: {
      mode: 'login',
    },
    loadComponent: () =>
      import('./components/auth-container.component').then((m) => m.AuthContainerComponent),
  },
];
