import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

export interface ProductionRecord {
  date: string;
  batchCount: number;
  outputKg: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private readonly api = inject(ApiService);

  getProductionRecords(): Observable<ApiResponse<ProductionRecord[]>> {
    return this.api.get<ApiResponse<ProductionRecord[]>>('production/records');
  }
}
