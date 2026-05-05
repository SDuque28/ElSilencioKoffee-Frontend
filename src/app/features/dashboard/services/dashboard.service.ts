import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';

import { isApiSuccessResponse, type ApiResponse } from '../../../core/models/api-response.model';
import type {
  ChartSeries,
  DashboardOverview,
  TopBuyer,
} from '../../../core/models/dashboard.model';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import {
  buildDashboardOverview,
  buildTopBuyers,
  createDefaultDashboardDateRange,
  buildOrderVolumeSeries,
  normalizeOrdersResponse,
  normalizeUsersResponse,
  type DashboardOrderApiResponse,
  type DashboardOrdersPageApiResponse,
  type DashboardUserApiResponse,
  type DashboardUsersPageApiResponse,
} from './dashboard.mappers';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly api = inject(ApiService);

  getOverview(startDate?: string, endDate?: string): Observable<ApiResponse<DashboardOverview>> {
    const range = this.resolveDateRange(startDate, endDate);

    return this.listOrders().pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        return {
          ...response,
          data: buildDashboardOverview(response.data, range),
        };
      }),
    );
  }

  getOrderVolumeSeries(startDate?: string, endDate?: string): Observable<ApiResponse<ChartSeries>> {
    const range = this.resolveDateRange(startDate, endDate);

    return this.listOrders().pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return response;
        }

        return {
          ...response,
          data: buildOrderVolumeSeries(response.data, range),
        };
      }),
    );
  }

  getTopBuyers(): Observable<ApiResponse<TopBuyer[]>> {
    return forkJoin({
      ordersResponse: this.listOrders(),
      usersResponse: this.listUsers(),
    }).pipe(
      map(({ ordersResponse, usersResponse }) => {
        if (!isApiSuccessResponse(ordersResponse)) {
          return ordersResponse;
        }

        const users = isApiSuccessResponse(usersResponse) ? usersResponse.data : [];

        return {
          success: true,
          data: buildTopBuyers(ordersResponse.data, users),
          message: ordersResponse.message,
        };
      }),
    );
  }

  private listOrders(): Observable<ApiResponse<DashboardOrderApiResponse[]>> {
    return this.api
      .get<DashboardOrderApiResponse[] | DashboardOrdersPageApiResponse>('orders', {
        baseUrl: environment.authApiUrl,
      })
      .pipe(
        map((response) => {
          if (!isApiSuccessResponse(response)) {
            return response;
          }

          return {
            ...response,
            data: normalizeOrdersResponse(response.data),
          };
        }),
      );
  }

  private listUsers(): Observable<ApiResponse<DashboardUserApiResponse[]>> {
    return this.api
      .get<DashboardUserApiResponse[] | DashboardUsersPageApiResponse>('users', {
        baseUrl: environment.authApiUrl,
      })
      .pipe(
        map((response) => {
          if (!isApiSuccessResponse(response)) {
            return response;
          }

          return {
            ...response,
            data: normalizeUsersResponse(response.data),
          };
        }),
      );
  }

  private resolveDateRange(
    startDate?: string,
    endDate?: string,
  ): {
    startDate: string;
    endDate: string;
  } {
    if (startDate && endDate) {
      return { startDate, endDate };
    }

    return createDefaultDashboardDateRange();
  }
}
