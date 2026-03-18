import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  if (environment.isMockMode) {
    return true;
  }

  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree(['/products']);
};
