import { inject, Injectable } from '@angular/core';
import { map, of, type Observable } from 'rxjs';

import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type { Cart } from '../../../core/models/cart.model';
import type { Order, OrderItem, OrdersListResult } from '../../../core/models/order.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

interface OrderApiResponse {
  id: string | number;
  items?: OrderItemApiResponse[];
  orderDate: string;
  status: string;
  totalAmount: number;
  userId: string | number;
}

interface OrderItemApiResponse {
  detailId: string | number;
  productId: string | number | null;
  productName: string;
  quantity: number;
  subtotal: number;
  unitPrice: number;
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

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);

  listOrders(): Observable<ApiResponse<OrdersListResult>> {
    if (this.authService.isAdmin()) {
      return this.api
        .get<OrdersPageApiResponse | OrderApiResponse[]>('orders', {
          baseUrl: environment.authApiUrl,
        })
        .pipe(map((response) => this.toOrdersListResultResponse(response, true)));
    }

    return this.api
      .get<OrderApiResponse[]>('users/me/orders', {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toOrdersListResultResponse(response, false)));
  }

  getOrder(orderId: string | number): Observable<ApiResponse<Order>> {
    return this.api
      .get<OrderApiResponse>(`orders/${orderId}`, {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toOrderResponse(response)));
  }

  payOrder(orderId: string | number): Observable<ApiResponse<Order>> {
    return this.api
      .post<OrderApiResponse>(`api/v1/orders/${orderId}/pay`, {}, {
        baseUrl: environment.authApiUrl,
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

      return of(errorResponse);
    }

    return this.api
      .post<OrderApiResponse>('orders', this.toCreateOrderRequest(cart), {
        baseUrl: environment.authApiUrl,
      })
      .pipe(map((response) => this.toOrderResponse(response)));
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
      items: (order.items ?? []).map((item) => this.toOrderItem(item)),
    };
  }

  private toOrderItem(item: OrderItemApiResponse): OrderItem {
    return {
      detailId: item.detailId,
      productId: item.productId ?? null,
      productName: item.productName,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
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
