import type { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';

export const REGISTER_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    data: {
      mode: 'register',
    },
    loadComponent: () =>
      import('./components/auth-container.component').then((m) => m.AuthContainerComponent),
  },
];
