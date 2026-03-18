import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import {
  type AuthSession,
  type LoginPayload,
  type RegisterPayload,
  type SessionUser,
} from '../models/auth.model';
import { isApiSuccessResponse, type ApiResponse } from '../models/api-response.model';
import { ApiService } from './api.service';

const TOKEN_STORAGE_KEY = 'esk.token';
const REFRESH_TOKEN_STORAGE_KEY = 'esk.refresh-token';
const USER_STORAGE_KEY = 'esk.user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  private readonly _refreshToken = signal<string | null>(
    localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY),
  );
  private readonly _user = signal<SessionUser | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly refreshToken = this._refreshToken.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.role === 'ADMIN');

  login(payload: LoginPayload): Observable<ApiResponse<AuthSession>> {
    return this.api
      .post<AuthSession>('auth/login', payload, {
        mock: {
          data: () => this.createMockSession(payload.email),
          message: 'Mock login completed successfully.',
        },
      })
      .pipe(tap((response) => this.persistSessionFromResponse(response)));
  }

  register(payload: RegisterPayload): Observable<ApiResponse<AuthSession>> {
    return this.api
      .post<AuthSession>('auth/register', payload, {
        mock: {
          data: () => this.createMockSession(payload.email, payload.name),
          message: 'Mock registration completed successfully.',
        },
      })
      .pipe(tap((response) => this.persistSessionFromResponse(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this._token.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    void this.router.navigateByUrl('/login');
  }

  private persistSessionFromResponse(response: ApiResponse<AuthSession>): void {
    if (!isApiSuccessResponse(response)) {
      return;
    }

    const { token, refreshToken, user } = response.data;
    this._token.set(token);
    this._refreshToken.set(refreshToken);
    this._user.set(user);

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private createMockSession(email: string, name?: string): AuthSession {
    const normalizedName =
      name ??
      email
        .split('@')[0]
        .split(/[._-]/)
        .filter(Boolean)
        .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
        .join(' ');

    const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'USER';
    const idSuffix = normalizedName.toLowerCase().replace(/\s+/g, '-');

    return {
      token: `mock-access-token-${role.toLowerCase()}-${idSuffix}`,
      refreshToken: `mock-refresh-token-${role.toLowerCase()}-${idSuffix}`,
      user: {
        id: `user-${idSuffix}`,
        name: normalizedName || 'El Silencio User',
        email,
        role,
        createdAt: '2026-03-18T10:00:00Z',
      },
    };
  }

  private readStoredUser(): SessionUser | null {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as SessionUser;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }
}
