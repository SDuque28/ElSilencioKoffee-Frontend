import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

export interface Order {
  id: string;
  date: string;
  total: number;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
}

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly api = inject(ApiService);

  listOrders(): Observable<ApiResponse<Order[]>> {
    return this.api.get<ApiResponse<Order[]>>('orders');
  }
}
