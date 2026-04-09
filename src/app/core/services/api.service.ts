import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { catchError, delay, map, of, tap, type Observable } from 'rxjs';

import {
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from '../models/api-response.model';
import { environment } from '../../../environments/environment';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE';

export interface MockOptions<T> {
  data: T | (() => T);
  delayMs?: number;
  message?: string;
}

export interface RequestOptions<T = unknown> {
  params?: Record<string, string | number | boolean | null | undefined>;
  mock?: MockOptions<T>;
  baseUrl?: string;
  bypassMock?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(endpoint: string, options?: RequestOptions<T>): Observable<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  post<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, body, options);
  }

  patch<T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, body, options);
  }

  delete<T>(endpoint: string, options?: RequestOptions<T>): Observable<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  private request<T>(
    method: HttpMethod,
    endpoint: string,
    body?: unknown,
    options?: RequestOptions<T>,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, options?.baseUrl);
    this.logRequest(method, url, options?.params, body);

    if (environment.isMockMode && !options?.bypassMock) {
      return this.mockRequest<T>(method, endpoint, options?.mock, options?.baseUrl);
    }

    return this.http
      .request<unknown>(method, url, {
        body,
        params: this.toHttpParams(options?.params),
      })
      .pipe(
        map((response) => this.normalizeResponse<T>(response)),
        tap((response) => this.logResponse(method, url, response)),
        catchError((error) => {
          const normalizedError = this.normalizeError(error);
          this.logError(method, url, normalizedError);
          return of(normalizedError);
        }),
      );
  }

  private buildUrl(endpoint: string, baseUrl = environment.apiUrl): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return `${baseUrl.replace(/\/+$/, '')}/${normalizedEndpoint}`;
  }

  private mockRequest<T>(
    method: HttpMethod,
    endpoint: string,
    mock?: MockOptions<T>,
    baseUrl?: string,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, baseUrl);

    if (!mock) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: `Mock no configurado para ${method} ${endpoint}`,
        code: 501,
      };

      this.logError(method, url, errorResponse);
      return of(errorResponse);
    }

    const data = typeof mock.data === 'function' ? (mock.data as () => T)() : mock.data;
    const response: ApiSuccessResponse<T> = {
      success: true,
      data,
      message: mock.message ?? 'Mock response generated successfully.',
    };

    return of(response).pipe(
      delay(mock.delayMs ?? 120),
      tap((result) => this.logResponse(method, url, result)),
    );
  }

  private toHttpParams(params?: RequestOptions['params']): HttpParams | undefined {
    if (!params) {
      return undefined;
    }

    let httpParams = new HttpParams();

    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null) {
        continue;
      }

      httpParams = httpParams.set(key, String(value));
    }

    return httpParams;
  }

  private normalizeResponse<T>(response: unknown): ApiResponse<T> {
    if (this.isApiResponse<T>(response)) {
      return response;
    }

    return {
      success: true,
      data: response as T,
      message: 'Request completed successfully.',
    };
  }

  private normalizeError(error: unknown): ApiErrorResponse {
    if (this.isApiErrorResponse(error)) {
      return error;
    }

    if (error instanceof HttpErrorResponse) {
      if (this.isApiErrorResponse(error.error)) {
        return error.error;
      }

      if (error.status === 0) {
        return {
          success: false,
          error: 'No se pudo conectar con el servidor.',
          code: 0,
        };
      }

      return {
        success: false,
        error:
          typeof error.error === 'string'
            ? error.error
            : (error.error?.error ??
                error.error?.message ??
                error.message ??
                'Unexpected API error.'),
        code: error.status || 500,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
        code: 500,
      };
    }

    return {
      success: false,
      error: 'Unknown API error.',
      code: 500,
    };
  }

  private isApiResponse<T>(value: unknown): value is ApiResponse<T> {
    return this.isApiSuccessResponse<T>(value) || this.isApiErrorResponse(value);
  }

  private isApiSuccessResponse<T>(value: unknown): value is ApiSuccessResponse<T> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      (value as { success: unknown }).success === true &&
      'data' in value &&
      'message' in value
    );
  }

  private isApiErrorResponse(value: unknown): value is ApiErrorResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      (value as { success: unknown }).success === false &&
      'error' in value &&
      'code' in value
    );
  }

  private logRequest(
    method: HttpMethod,
    url: string,
    params?: RequestOptions['params'],
    body?: unknown,
  ): void {
    if (!environment.debugApiLogging) {
      return;
    }

    console.info(`[API ${environment.isMockMode ? 'MOCK' : 'REAL'}] ${method} ${url}`, {
      params,
      body,
    });
  }

  private logResponse<T>(method: HttpMethod, url: string, response: ApiResponse<T>): void {
    if (!environment.debugApiLogging) {
      return;
    }

    console.info(`[API RESPONSE] ${method} ${url}`, response);
  }

  private logError(method: HttpMethod, url: string, error: ApiErrorResponse): void {
    if (!environment.debugApiLogging) {
      return;
    }

    console.error(`[API ERROR] ${method} ${url}`, error);
  }
}
