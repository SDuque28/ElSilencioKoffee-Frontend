import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';

export interface OrdersUserSummary {
  activo: boolean;
  createdAt: string;
  email: string;
  id: string | number;
  username: string;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private readonly api = inject(ApiService);

  listUsers(): Observable<ApiResponse<OrdersUserSummary[]>> {
    return this.api.get<OrdersUserSummary[]>('users', {
      baseUrl: environment.authApiUrl,
      bypassMock: true,
    });
  }
}
