import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

export interface SalesMetric {
  label: string;
  value: number;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getSalesMetrics(): Observable<ApiResponse<SalesMetric[]>> {
    return this.api.get<ApiResponse<SalesMetric[]>>('dashboard/sales');
  }

  getTopBuyers(): Observable<ApiResponse<Array<{ name: string; purchases: number }>>> {
    return this.api.get<ApiResponse<Array<{ name: string; purchases: number }>>>(
      'dashboard/top-buyers',
    );
  }
}
