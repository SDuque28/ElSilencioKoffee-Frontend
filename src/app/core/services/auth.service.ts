import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import type { Observable } from 'rxjs';

import type { User } from '../models/user.model';
import { ApiService } from './api.service';

const TOKEN_STORAGE_KEY = 'esk.token';
const USER_STORAGE_KEY = 'esk.user';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_STORAGE_KEY));
  private readonly _user = signal<User | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly currentUser = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.roles.includes('ADMIN') ?? false);

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/login', payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.api
      .post<AuthResponse>('auth/register', payload)
      .pipe(tap((response) => this.persistSession(response)));
  }

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    this._token.set(null);
    this._user.set(null);
    void this.router.navigateByUrl('/login');
  }

  private persistSession(response: AuthResponse): void {
    this._token.set(response.token);
    this._user.set(response.user);

    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }

  private readStoredUser(): User | null {
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as User;
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY);
      return null;
    }
  }
}
