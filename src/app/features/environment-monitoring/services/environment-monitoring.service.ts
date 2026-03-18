import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import type { EnvironmentReading } from '../../../core/models/environment-reading.model';
import { ApiService } from '../../../core/services/api.service';

const MOCK_ENVIRONMENT_READINGS: EnvironmentReading[] = [
  {
    id: 'env-0800',
    temperature: 21.2,
    humidity: 68,
    timestamp: '2026-03-18T08:00:00Z',
  },
  {
    id: 'env-1000',
    temperature: 22.4,
    humidity: 65,
    timestamp: '2026-03-18T10:00:00Z',
  },
  {
    id: 'env-1200',
    temperature: 24.1,
    humidity: 62,
    timestamp: '2026-03-18T12:00:00Z',
  },
  {
    id: 'env-1400',
    temperature: 25.0,
    humidity: 59,
    timestamp: '2026-03-18T14:00:00Z',
  },
  {
    id: 'env-1600',
    temperature: 23.8,
    humidity: 63,
    timestamp: '2026-03-18T16:00:00Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class EnvironmentMonitoringService {
  private readonly api = inject(ApiService);

  listReadings(page = 1, limit = 10): Observable<ApiResponse<EnvironmentReading[]>> {
    const startIndex = (page - 1) * limit;
    const readings = MOCK_ENVIRONMENT_READINGS.slice(startIndex, startIndex + limit);

    return this.api.get<EnvironmentReading[]>('environment/readings', {
      params: { page, limit },
      mock: {
        data: readings,
        delayMs: 0,
        message: 'Mock environment readings loaded successfully.',
      },
    });
  }

  getLatestReading(): Observable<ApiResponse<EnvironmentReading>> {
    return this.api.get<EnvironmentReading>('environment/readings/latest', {
      mock: {
        data: MOCK_ENVIRONMENT_READINGS[MOCK_ENVIRONMENT_READINGS.length - 1],
        delayMs: 0,
        message: 'Mock latest environment reading loaded successfully.',
      },
    });
  }
}
