import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Production } from '../../../core/models/production.model';
import { ApiService } from '../../../core/services/api.service';

const MOCK_PRODUCTION: Production[] = [
  { id: 'prod-record-01', date: '2026-03-04', quantity: 820 },
  { id: 'prod-record-02', date: '2026-03-11', quantity: 790 },
  { id: 'prod-record-03', date: '2026-03-18', quantity: 915 },
  { id: 'prod-record-04', date: '2026-03-25', quantity: 870 },
];

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private readonly api = inject(ApiService);

  listProduction(page = 1, limit = 10): Observable<ApiResponse<Production[]>> {
    const startIndex = (page - 1) * limit;
    const records = MOCK_PRODUCTION.slice(startIndex, startIndex + limit);

    return this.api.get<Production[]>('production', {
      params: { page, limit },
      mock: {
        data: records,
        delayMs: 0,
        message: 'Mock production records loaded successfully.',
      },
    });
  }
}
