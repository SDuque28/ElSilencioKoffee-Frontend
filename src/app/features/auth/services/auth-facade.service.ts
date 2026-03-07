import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import {
  AuthService,
  type LoginPayload,
  type RegisterPayload,
} from '../../../core/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthFacadeService {
  private readonly authService = inject(AuthService);

  login(payload: LoginPayload): Observable<unknown> {
    return this.authService.login(payload);
  }

  register(payload: RegisterPayload): Observable<unknown> {
    return this.authService.register(payload);
  }
}
