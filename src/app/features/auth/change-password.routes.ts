import type { Routes } from '@angular/router';

import { authGuard } from '../../core/guards/auth.guard';
import { MainLayoutComponent } from '../../layout/main-layout/main-layout.component';

export const CHANGE_PASSWORD_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    data: { layout: 'public' },
    children: [
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./pages/change-password-page.component').then((m) => m.ChangePasswordPageComponent),
      },
    ],
  },
];
