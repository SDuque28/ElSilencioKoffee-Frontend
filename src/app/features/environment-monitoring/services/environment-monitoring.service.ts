import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { isApiSuccessResponse, type ApiResponse } from '../../../core/models/api-response.model';
import type { EnvironmentReading } from '../../../core/models/environment-reading.model';
import { ApiService } from '../../../core/services/api.service';

interface BackendEnvironmentMetricResponse {
  id: number;
  metricType: string;
  value: number;
  unit: string;
  measuredAt: string;
}

export interface EnvironmentChartSeries {
  humidityValues: number[];
  labels: string[];
  temperatureValues: number[];
}

@Injectable({
  providedIn: 'root',
})
export class EnvironmentMonitoringService {
  private readonly api = inject(ApiService);
  private readonly timeFormatter = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  listReadings(page = 1, limit = 10): Observable<ApiResponse<EnvironmentReading[]>> {
    return this.api.get<BackendEnvironmentMetricResponse[]>('environment-metrics').pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        const readings = this.toReadings(response.data).slice((page - 1) * limit, page * limit);
        return {
          ...response,
          data: readings,
        };
      }),
    );
  }

  getLatestReading(): Observable<ApiResponse<EnvironmentReading>> {
    return this.listReadings().pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        const latestReading = response.data[response.data.length - 1];
        if (!latestReading) {
          return {
            success: false,
            error: 'No environment readings are available.',
            code: 404,
          };
        }

        return {
          success: true,
          data: latestReading,
          message: response.message,
        };
      }),
    );
  }

  getChartSeries(page = 1, limit = 10): Observable<ApiResponse<EnvironmentChartSeries>> {
    return this.listReadings(page, limit).pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        return {
          ...response,
          data: {
            labels: response.data.map((reading) => this.formatTimeLabel(reading.timestamp)),
            temperatureValues: response.data.map((reading) =>
              Number.isFinite(reading.temperature) ? reading.temperature : 0,
            ),
            humidityValues: response.data.map((reading) =>
              Number.isFinite(reading.humidity) ? reading.humidity : 0,
            ),
          },
        };
      }),
    );
  }

  private toReadings(metrics: BackendEnvironmentMetricResponse[]): EnvironmentReading[] {
    const groupedReadings = new Map<
      string,
      { id: string; timestamp: string; temperature?: number; humidity?: number }
    >();

    for (const metric of metrics) {
      const timestamp = metric.measuredAt;
      const reading = groupedReadings.get(timestamp) ?? {
        id: `reading-${timestamp}`,
        timestamp,
      };

      if (metric.metricType.toLowerCase() === 'temperature') {
        reading.temperature = Number(metric.value);
      }

      if (metric.metricType.toLowerCase() === 'humidity') {
        reading.humidity = Number(metric.value);
      }

      groupedReadings.set(timestamp, reading);
    }

    return Array.from(groupedReadings.values())
      .filter(
        (reading): reading is EnvironmentReading =>
          typeof reading.temperature === 'number' && typeof reading.humidity === 'number',
      )
      .sort((left, right) => left.timestamp.localeCompare(right.timestamp));
  }

  private formatTimeLabel(value: string): string {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value.slice(11, 16);
    }

    return this.timeFormatter.format(parsedDate);
  }
}
