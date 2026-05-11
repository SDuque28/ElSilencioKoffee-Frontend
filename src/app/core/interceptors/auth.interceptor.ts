import { inject } from '@angular/core';
import { HttpErrorResponse, type HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  const isKnownApiRequest =
    request.url.startsWith(environment.apiUrl) || request.url.startsWith(environment.authApiUrl);

  if (!isKnownApiRequest) {
    return next(request);
  }

  const setHeaders: Record<string, string> = token ? authService.getAuthHeaders() : {};

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
              error: resolveHttpErrorMessage(error),
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

function resolveHttpErrorMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string' && error.error.trim().length > 0) {
    return error.error;
  }

  const apiError = readStringProperty(error.error, 'error');
  if (apiError) {
    return apiError;
  }

  const apiMessage = readStringProperty(error.error, 'message');
  if (apiMessage) {
    return apiMessage;
  }

  return error.message || 'Unexpected HTTP error.';
}

function readStringProperty(value: unknown, key: 'error' | 'message'): string | null {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return null;
  }

  const property = (value as Record<'error' | 'message', unknown>)[key];
  return typeof property === 'string' ? property : null;
}
