import { inject, Injectable, signal } from '@angular/core';
import { delay, map, of, type Observable } from 'rxjs';

import type { ApiErrorResponse, ApiResponse } from '../../../core/models/api-response.model';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Cart } from '../../../core/models/cart.model';
import type { Order, OrdersListResult } from '../../../core/models/order.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface OrderApiResponse {
  id: string | number;
  orderDate: string;
  status: string;
  totalAmount: number;
  userId: string | number;
}

interface OrderCreateApiItemRequest {
  productId: number;
  quantity: number;
}

interface OrderCreateApiRequest {
  items: OrderCreateApiItemRequest[];
}

interface OrdersPageApiResponse {
  content: OrderApiResponse[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 4,
    orderDate: '2026-04-13T12:05:09',
    status: 'NON PAID',
    totalAmount: 52.24,
    userId: 1,
  },
  {
    id: 3,
    orderDate: '2026-04-13T12:04:52',
    status: 'NON PAID',
    totalAmount: 223.1,
    userId: 1,
  },
  {
    id: 2,
    orderDate: '2026-04-13T12:04:42',
    status: 'NON PAID',
    totalAmount: 82.3,
    userId: 2,
  },
  {
    id: 1,
    orderDate: '2026-04-13T12:01:11',
    status: 'PAID',
    totalAmount: 120.5,
    userId: 1,
  },
];

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly _orders = signal<Order[]>(INITIAL_MOCK_ORDERS);

  listOrders(): Observable<ApiResponse<OrdersListResult>> {
    if (this.authService.isAdmin()) {
      return this.api
        .get<OrdersPageApiResponse | OrderApiResponse[]>('orders', {
          baseUrl: environment.authApiUrl,
          bypassMock: true,
        })
        .pipe(map((response) => this.toOrdersListResultResponse(response, true)));
    }

    return this.api
      .get<OrderApiResponse[]>('users/me/orders', {
        baseUrl: environment.authApiUrl,
        bypassMock: true,
      })
      .pipe(map((response) => this.toOrdersListResultResponse(response, false)));
  }

  getOrder(orderId: string | number): Observable<ApiResponse<Order>> {
    if (!environment.isMockMode) {
      return this.api
        .get<OrderApiResponse>(`orders/${orderId}`, {
          baseUrl: environment.authApiUrl,
        })
        .pipe(map((response) => this.toOrderResponse(response)));
    }

    const order = this._orders().find((item) => String(item.id) === String(orderId));

    if (!order) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Mock order not found.',
        code: 404,
      };

      return of(errorResponse).pipe(delay(0));
    }

    return this.api
      .get<OrderApiResponse>(`orders/${orderId}`, {
        baseUrl: environment.authApiUrl,
        mock: {
          data: this.toOrderApiResponse(order),
          delayMs: 0,
          message: 'Mock order loaded successfully.',
        },
      })
      .pipe(map((response) => this.toOrderResponse(response)));
  }

  createOrderFromCart(cart: Cart): Observable<ApiResponse<Order>> {
    if (cart.items.length === 0) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Cart is empty.',
        code: 400,
      };

      return of(errorResponse).pipe(delay(0));
    }

    return this.api
      .post<OrderApiResponse>('orders', this.toCreateOrderRequest(cart), {
        baseUrl: environment.authApiUrl,
        bypassMock: true,
      })
      .pipe(
        map((response) => {
          if (isApiSuccessResponse(response)) {
            this._orders.update((orders) => [this.toOrder(response.data), ...orders]);
          }

          return this.toOrderResponse(response);
        }),
      );
  }

  private toOrdersListResultResponse(
    response: ApiResponse<OrdersPageApiResponse | OrderApiResponse[]>,
    isAdminView: boolean,
  ): ApiResponse<OrdersListResult> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    if (isAdminView) {
      if (Array.isArray(response.data)) {
        const orders = response.data.map((order) => this.toOrder(order));

        return {
          ...response,
          data: {
            orders,
            totalElements: orders.length,
            totalPages: orders.length > 0 ? 1 : 0,
            pageNumber: 0,
          },
        };
      }

      const pageResponse = response.data;

      return {
        ...response,
        data: {
          orders: (pageResponse.content ?? []).map((order) => this.toOrder(order)),
          totalElements: pageResponse.totalElements,
          totalPages: pageResponse.totalPages,
          pageNumber: pageResponse.number,
        },
      };
    }

    const orders = (response.data as OrderApiResponse[]).map((order) => this.toOrder(order));

    return {
      ...response,
      data: {
        orders,
        totalElements: orders.length,
        totalPages: orders.length > 0 ? 1 : 0,
        pageNumber: 0,
      },
    };
  }

  private toOrderResponse(response: ApiResponse<OrderApiResponse>): ApiResponse<Order> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    return {
      ...response,
      data: this.toOrder(response.data),
    };
  }

  private toOrder(order: OrderApiResponse): Order {
    return {
      id: order.id,
      orderDate: order.orderDate,
      status: order.status,
      totalAmount: order.totalAmount,
      userId: order.userId,
    };
  }

  private toOrderApiResponse(order: Order): OrderApiResponse {
    return {
      id: order.id,
      orderDate: order.orderDate,
      status: order.status,
      totalAmount: order.totalAmount,
      userId: order.userId,
    };
  }

  private toCreateOrderRequest(cart: Cart): OrderCreateApiRequest {
    return {
      items: cart.items.map((item) => ({
        productId: item.backendProductId,
        quantity: item.quantity,
      })),
    };
  }
}
