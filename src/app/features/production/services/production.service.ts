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

export interface ProductionChartSeries {
  labels: string[];
  quantities: number[];
}

@Injectable({
  providedIn: 'root',
})
export class ProductionService {
  private readonly api = inject(ApiService);
  private readonly labelFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  });

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
            .reverse()
            .map((record) => ({
              id: String(record.id),
              date: record.collectionDate,
              quantity: Number(record.quantityKg),
            })),
        };
      }),
    );
  }

  getProductionChartSeries(page = 1, limit = 10): Observable<ApiResponse<ProductionChartSeries>> {
    return this.listProduction(page, limit).pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        return {
          ...response,
          data: {
            labels: response.data.map((record) => this.formatDateLabel(record.date)),
            quantities: response.data.map((record) =>
              Number.isFinite(record.quantity) ? record.quantity : 0,
            ),
          },
        };
      }),
    );
  }

  private formatDateLabel(value: string): string {
    const parsedDate = new Date(`${value}T00:00:00`);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return this.labelFormatter.format(parsedDate);
  }
}
