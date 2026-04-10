import type { Routes } from '@angular/router';

import { guestGuard } from '../../core/guards/guest.guard';

export const PASSWORD_RECOVERY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/password-recovery-page.component').then((m) => m.PasswordRecoveryPageComponent),
  },
];
