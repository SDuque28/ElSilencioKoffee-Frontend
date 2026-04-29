import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { isApiSuccessResponse, type ApiResponse } from '../../../core/models/api-response.model';
import type { Production } from '../../../core/models/production.model';
import { ApiService } from '../../../core/services/api.service';

interface BackendProductionResponse {
  id: number;
  collectionDate: string;
  quantityKg: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private readonly api = inject(ApiService);

  listProduction(page = 1, limit = 10): Observable<ApiResponse<Production[]>> {
    return this.api.get<BackendProductionResponse[]>('production').pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        return {
          ...response,
          data: response.data
            .slice((page - 1) * limit, page * limit)
            .map((record) => ({
              id: String(record.id),
              date: record.collectionDate,
              quantity: Number(record.quantityKg),
            })),
        };
      }),
    );
  }
}
