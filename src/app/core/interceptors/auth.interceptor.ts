import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  if (!request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }

  const setHeaders: Record<string, string> = {};

  if (token) {
    setHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (
    !request.headers.has('Content-Type') &&
    (request.method === 'POST' || request.method === 'PATCH')
  ) {
    setHeaders['Content-Type'] = 'application/json';
  }

  const nextRequest = Object.keys(setHeaders).length > 0 ? request.clone({ setHeaders }) : request;

  return next(nextRequest).pipe(
    catchError((error: unknown) => {
      const normalizedError =
        error instanceof HttpErrorResponse
          ? {
              success: false as const,
              error:
                error.error?.error ??
                error.error?.message ??
                error.message ??
                'Unexpected HTTP error.',
              code: error.status || 500,
            }
          : {
              success: false as const,
              error: 'Unknown HTTP error.',
              code: 500,
            };

      if (environment.debugApiLogging) {
        console.error(`[HTTP ERROR] ${nextRequest.method} ${nextRequest.url}`, normalizedError);
      }

      return throwError(() => normalizedError);
    }),
  );
};
