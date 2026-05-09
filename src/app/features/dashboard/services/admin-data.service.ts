import { inject, Injectable } from '@angular/core';
import { forkJoin, map, type Observable } from 'rxjs';

import { isApiSuccessResponse, type ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { environment } from '../../../../environments/environment';
import type {
  AdminEnvironmentMetricApi,
  AdminInventoryApi,
  AdminOrderApi,
  AdminProductApi,
  AdminProductCreateRequest,
  AdminProductionApi,
  AdminSnapshotApi,
  AdminUserApi,
  AdminUserRoleApi,
} from '../models/admin-api.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDataService {
  private readonly api = inject(ApiService);

  getSnapshot(): Observable<ApiResponse<AdminSnapshotApi>> {
    return forkJoin({
      orders: this.listAdminOrders(),
      users: this.listUsers(),
      products: this.listProducts(),
      inventory: this.listInventory(),
      production: this.listProduction(),
      environmentMetrics: this.listEnvironmentMetrics(),
    }).pipe(
      map((responses) => {
        const criticalError =
          firstError(responses.orders) ?? firstError(responses.users) ?? firstError(responses.products);

        if (criticalError) {
          return criticalError;
        }

        return {
          success: true,
          data: {
            orders: isApiSuccessResponse(responses.orders) ? responses.orders.data : [],
            users: isApiSuccessResponse(responses.users) ? responses.users.data : [],
            products: isApiSuccessResponse(responses.products) ? responses.products.data : [],
            inventory: isApiSuccessResponse(responses.inventory) ? responses.inventory.data : [],
            production: isApiSuccessResponse(responses.production) ? responses.production.data : [],
            environmentMetrics: isApiSuccessResponse(responses.environmentMetrics)
              ? responses.environmentMetrics.data
              : [],
          },
          message: 'Admin snapshot loaded.',
        };
      }),
    );
  }

  listAdminOrders(): Observable<ApiResponse<AdminOrderApi[]>> {
    return this.api.get<AdminOrderApi[]>('api/v1/admin/orders', {
      baseUrl: environment.authApiUrl,
    });
  }

  getAdminOrder(orderId: string | number): Observable<ApiResponse<AdminOrderApi>> {
    return this.api.get<AdminOrderApi>(`api/v1/admin/orders/${orderId}`, {
      baseUrl: environment.authApiUrl,
    });
  }

  updateOrderStatus(
    orderId: string | number,
    status: 'PENDING' | 'PAID',
  ): Observable<ApiResponse<AdminOrderApi>> {
    return this.api.patch<AdminOrderApi>(
      `orders/${orderId}/status`,
      { status },
      {
        baseUrl: environment.authApiUrl,
      },
    );
  }

  listUsers(): Observable<ApiResponse<AdminUserApi[]>> {
    return this.api.get<AdminUserApi[]>('users', {
      baseUrl: environment.authApiUrl,
    });
  }

  getUser(userId: string | number): Observable<ApiResponse<AdminUserApi>> {
    return this.api.get<AdminUserApi>(`users/${userId}`, {
      baseUrl: environment.authApiUrl,
    });
  }

  getUserOrders(userId: string | number): Observable<ApiResponse<AdminOrderApi[]>> {
    return this.api.get<AdminOrderApi[]>(`users/${userId}/orders`, {
      baseUrl: environment.authApiUrl,
    });
  }

  getUserRoles(userId: string | number): Observable<ApiResponse<AdminUserRoleApi[]>> {
    return this.api.get<AdminUserRoleApi[]>(`usuario-roles/usuario/${userId}`, {
      baseUrl: environment.authApiUrl,
    });
  }

  listProducts(): Observable<ApiResponse<AdminProductApi[]>> {
    return this.api.get<AdminProductApi[]>('products', {
      baseUrl: environment.authApiUrl,
    });
  }

  createProduct(payload: AdminProductCreateRequest): Observable<ApiResponse<AdminProductApi>> {
    return this.api.post<AdminProductApi>('products', payload, {
      baseUrl: environment.authApiUrl,
    });
  }

  listInventory(): Observable<ApiResponse<AdminInventoryApi[]>> {
    return this.api.get<AdminInventoryApi[]>('inventory', {
      baseUrl: environment.authApiUrl,
    });
  }

  listProduction(): Observable<ApiResponse<AdminProductionApi[]>> {
    return this.api.get<AdminProductionApi[]>('production', {
      baseUrl: environment.authApiUrl,
    });
  }

  listEnvironmentMetrics(): Observable<ApiResponse<AdminEnvironmentMetricApi[]>> {
    return this.api.get<AdminEnvironmentMetricApi[]>('environment-metrics', {
      baseUrl: environment.authApiUrl,
    });
  }
}

function firstError<T>(response: ApiResponse<T>): ApiResponse<AdminSnapshotApi> | null {
  if (isApiSuccessResponse(response)) {
    return null;
  }
  return response;
}
