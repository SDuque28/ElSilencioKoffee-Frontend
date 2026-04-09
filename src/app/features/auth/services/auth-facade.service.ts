import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type {
  LoginRequest,
  RegisterRequest,
  UserSession,
} from '../../../core/models/auth.model';
import type { ApiResponse } from '../../../core/models/api-response.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacadeService {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly isAuthenticated = this.authService.isAuthenticated;
  readonly isAdmin = this.authService.isAdmin;

  login(payload: LoginRequest): Observable<ApiResponse<UserSession>> {
    return this.authService.login(payload);
  }

  register(payload: RegisterRequest): Observable<ApiResponse<UserSession>> {
    return this.authService.register(payload);
  }
}
