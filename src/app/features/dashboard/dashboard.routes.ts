import type { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard-home-page.component').then((m) => m.DashboardHomePageComponent),
  },
  {
    path: 'analytics',
    loadComponent: () =>
      import('./pages/dashboard-analytics-page.component').then(
        (m) => m.DashboardAnalyticsPageComponent,
      ),
  },
  {
    path: 'sales',
    redirectTo: 'analytics',
    pathMatch: 'full',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/dashboard-products-page.component').then((m) => m.DashboardProductsPageComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./pages/dashboard-orders-page.component').then((m) => m.DashboardOrdersPageComponent),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./pages/dashboard-users-page.component').then((m) => m.DashboardUsersPageComponent),
  },
  {
    path: 'monitoring',
    loadComponent: () =>
      import('./pages/dashboard-monitoring-page.component').then(
        (m) => m.DashboardMonitoringPageComponent,
      ),
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./pages/dashboard-settings-page.component').then((m) => m.DashboardSettingsPageComponent),
  },
  {
    path: 'environment',
    redirectTo: 'monitoring',
    pathMatch: 'full',
  },
  {
    path: 'production',
    redirectTo: 'monitoring',
    pathMatch: 'full',
  },
];
