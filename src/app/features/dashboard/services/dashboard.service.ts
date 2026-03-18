import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import type { DashboardMetric, SalesMetric, TopBuyer } from '../../../core/models/dashboard.model';
import { ApiService } from '../../../core/services/api.service';

const MOCK_DASHBOARD_METRICS: DashboardMetric[] = [
  { label: 'Monthly Revenue', value: '$ 96,000' },
  { label: 'Active Customers', value: '148' },
  { label: 'Completed Orders', value: '42' },
];

const MOCK_SALES_METRICS: SalesMetric[] = [
  { label: 'Week 1', value: 24 },
  { label: 'Week 2', value: 31 },
  { label: 'Week 3', value: 28 },
  { label: 'Week 4', value: 36 },
];

const MOCK_TOP_BUYERS: TopBuyer[] = [
  { name: 'Camila Perez', purchases: 24, totalSpend: 1280000 },
  { name: 'Daniel Torres', purchases: 18, totalSpend: 1010000 },
  { name: 'Ana Mercado', purchases: 14, totalSpend: 860000 },
];

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getMetrics(): Observable<ApiResponse<DashboardMetric[]>> {
    return this.api.get<DashboardMetric[]>('dashboard/metrics', {
      mock: {
        data: MOCK_DASHBOARD_METRICS,
        delayMs: 0,
        message: 'Mock dashboard metrics loaded successfully.',
      },
    });
  }

  getSalesMetrics(
    startDate = '2026-03-01',
    endDate = '2026-03-31',
  ): Observable<ApiResponse<SalesMetric[]>> {
    return this.api.get<SalesMetric[]>('dashboard/sales', {
      params: { startDate, endDate },
      mock: {
        data: MOCK_SALES_METRICS,
        delayMs: 0,
        message: 'Mock dashboard sales loaded successfully.',
      },
    });
  }

  getTopBuyers(): Observable<ApiResponse<TopBuyer[]>> {
    return this.api.get<TopBuyer[]>('dashboard/top-buyers', {
      mock: {
        data: MOCK_TOP_BUYERS,
        delayMs: 0,
        message: 'Mock dashboard top buyers loaded successfully.',
      },
    });
  }
}
