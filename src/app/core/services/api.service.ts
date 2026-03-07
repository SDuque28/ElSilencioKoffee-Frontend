import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface RequestOptions {
  params?: Record<string, string | number | boolean | null | undefined>;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);

  get<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.get<T>(this.buildUrl(endpoint), {
      params: this.toHttpParams(options?.params),
    });
  }

  post<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.post<T>(this.buildUrl(endpoint), body, {
      params: this.toHttpParams(options?.params),
    });
  }

  put<T>(endpoint: string, body: unknown, options?: RequestOptions): Observable<T> {
    return this.http.put<T>(this.buildUrl(endpoint), body, {
      params: this.toHttpParams(options?.params),
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions): Observable<T> {
    return this.http.delete<T>(this.buildUrl(endpoint), {
      params: this.toHttpParams(options?.params),
    });
  }

  private buildUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }

    const normalizedEndpoint = endpoint.replace(/^\/+/, '');
    return `${environment.apiUrl}/${normalizedEndpoint}`;
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
}
