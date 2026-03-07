import type { Routes } from '@angular/router';

export const ENVIRONMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/environment-monitoring-page.component').then(
        (m) => m.EnvironmentMonitoringPageComponent,
      ),
  },
];
