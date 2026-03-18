import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { AuthSession, LoginPayload, RegisterPayload } from '../../../core/models/auth.model';
import type { ApiResponse } from '../../../core/models/api-response.model';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacadeService {
  private readonly authService = inject(AuthService);

  login(payload: LoginPayload): Observable<ApiResponse<AuthSession>> {
    return this.authService.login(payload);
  }

  register(payload: RegisterPayload): Observable<ApiResponse<AuthSession>> {
    return this.authService.register(payload);
  }
}
