import type { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard-home-page.component').then((m) => m.DashboardHomePageComponent),
  },
  {
    path: 'sales',
    loadComponent: () =>
      import('./pages/dashboard-sales-page.component').then((m) => m.DashboardSalesPageComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/dashboard-users-page.component').then((m) => m.DashboardUsersPageComponent),
  },
  {
    path: 'environment',
    loadChildren: () =>
      import('../environment-monitoring/environment-monitoring.routes').then(
        (m) => m.ENVIRONMENT_ROUTES,
      ),
  },
  {
    path: 'production',
    loadChildren: () => import('../production/production.routes').then((m) => m.PRODUCTION_ROUTES),
  },
];
