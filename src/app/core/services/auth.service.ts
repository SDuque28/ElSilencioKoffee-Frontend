import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import {
  type AuthResponse,
  type LoginRequest,
  type RegisterRequest,
  type SessionUser,
  type UserSession,
} from '../models/auth.model';
import { isApiSuccessResponse, type ApiResponse } from '../models/api-response.model';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';

const TOKEN_STORAGE_KEY = 'esk.token';
const SESSION_STORAGE_KEY = 'esk.session';
const LEGACY_REFRESH_TOKEN_STORAGE_KEY = 'esk.refresh-token';
const LEGACY_USER_STORAGE_KEY = 'esk.user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _session = signal<UserSession | null>(this.readStoredSession());

  readonly session = this._session.asReadonly();
  readonly token = computed(() => this._session()?.token ?? null);
  readonly currentUser = computed(() => this._session()?.user ?? null);
  readonly isAuthenticated = computed(() => Boolean(this._session()?.token));
  readonly isAdmin = computed(() => this.hasRole('ROLE_ADMIN'));

  login(payload: LoginRequest): Observable<ApiResponse<UserSession>> {
    return this.api
      .post<AuthResponse>('auth/login', payload, {
        baseUrl: environment.authApiUrl,
        bypassMock: true,
      })
      .pipe(
        map((response) => this.normalizeAuthResponse(response)),
        tap((response) => {
          if (isApiSuccessResponse(response)) {
            this.saveSession(response.data);
          }
        }),
      );
  }

  register(payload: RegisterRequest): Observable<ApiResponse<UserSession>> {
    return this.api
      .post<AuthResponse>('auth/register', payload, {
        baseUrl: environment.authApiUrl,
        bypassMock: true,
      })
      .pipe(
        map((response) => this.normalizeAuthResponse(response)),
        tap((response) => {
          if (isApiSuccessResponse(response)) {
            this.saveSession(response.data);
          }
        }),
      );
  }

  saveSession(session: UserSession): void {
    this._session.set(session);
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  getSession(): UserSession | null {
    return this._session();
  }

  getAuthenticatedUser(): SessionUser | null {
    return this.currentUser();
  }

  getToken(): string | null {
    return this.token();
  }

  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isSessionActive(): boolean {
    return this.isAuthenticated();
  }

  clearSession(): void {
    this.clearStoredSession();
    this._session.set(null);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigateByUrl('/login');
  }

  hasRole(role: string): boolean {
    return this._session()?.roles.includes(role) ?? false;
  }

  private normalizeAuthResponse(response: ApiResponse<AuthResponse>): ApiResponse<UserSession> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    try {
      return {
        success: true,
        data: this.toSession(response.data),
        message: response.message,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'La respuesta del servidor no tiene el formato esperado.',
        code: 500,
      };
    }
  }

  private toSession(response: AuthResponse): UserSession {
    if (
      !response ||
      typeof response.token !== 'string' ||
      typeof response.username !== 'string' ||
      typeof response.email !== 'string' ||
      !Array.isArray(response.roles)
    ) {
      throw new Error('La respuesta de autenticacion es invalida.');
    }

    const token = response.token.trim();
    const username = response.username.trim();
    const email = response.email.trim();
    const roles = response.roles.filter((role): role is string => typeof role === 'string');

    if (!token || !username || !email) {
      throw new Error('La respuesta de autenticacion esta incompleta.');
    }

    return {
      token,
      username,
      email,
      roles,
      user: {
        id: username,
        username,
        name: username,
        email,
        roles,
        role: this.resolveRole(roles),
      },
    };
  }

  private resolveRole(roles: string[]): 'ADMIN' | 'USER' {
    return roles.includes('ROLE_ADMIN') ? 'ADMIN' : 'USER';
  }

  private readStoredSession(): UserSession | null {
    const rawSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const rawToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!rawSession) {
      if (rawToken) {
        this.clearStoredSession();
      }

      return null;
    }

    try {
      const parsedSession = JSON.parse(rawSession) as UserSession;
      const session = this.toSession({
        token: rawToken ?? parsedSession.token,
        username: parsedSession.username ?? parsedSession.user?.username,
        email: parsedSession.email ?? parsedSession.user?.email,
        roles: parsedSession.roles ?? parsedSession.user?.roles ?? [],
      });

      if (session.token !== rawToken) {
        this.saveSession(session);
      }

      return session;
    } catch {
      this.clearStoredSession();
      return null;
    }
  }

  private clearStoredSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LEGACY_REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_USER_STORAGE_KEY);
  }
}
