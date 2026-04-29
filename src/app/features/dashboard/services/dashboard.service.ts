import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import type { DashboardMetric, SalesMetric, TopBuyer } from '../../../core/models/dashboard.model';
import { ApiService } from '../../../core/services/api.service';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getMetrics(): Observable<ApiResponse<DashboardMetric[]>> {
    return this.api.get<DashboardMetric[]>('dashboard/metrics');
  }

  getSalesMetrics(
    startDate = '2026-03-01',
    endDate = '2026-03-31',
  ): Observable<ApiResponse<SalesMetric[]>> {
    return this.api.get<SalesMetric[]>('dashboard/sales', {
      params: { startDate, endDate },
    });
  }

  getTopBuyers(): Observable<ApiResponse<TopBuyer[]>> {
    return this.api.get<TopBuyer[]>('dashboard/top-buyers');
  }
}
