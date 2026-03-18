import { inject, Injectable, signal } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';

import type { ApiErrorResponse, ApiResponse } from '../../../core/models/api-response.model';
import type { Cart } from '../../../core/models/cart.model';
import type { Order } from '../../../core/models/order.model';
import { ApiService } from '../../../core/services/api.service';

const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 'order-2026-0304',
    userId: 'user-mock-admin',
    status: 'DELIVERED',
    total: 48000,
    createdAt: '2026-03-04T14:30:00Z',
  },
  {
    id: 'order-2026-0308',
    userId: 'user-mock-user',
    status: 'SHIPPED',
    total: 31500,
    createdAt: '2026-03-08T09:15:00Z',
  },
  {
    id: 'order-2026-0316',
    userId: 'user-mock-user',
    status: 'PENDING',
    total: 16500,
    createdAt: '2026-03-16T18:05:00Z',
  },
];

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly api = inject(ApiService);
  private readonly _orders = signal<Order[]>(INITIAL_MOCK_ORDERS);

  listOrders(page = 1, limit = 10): Observable<ApiResponse<Order[]>> {
    const startIndex = (page - 1) * limit;
    const orders = this._orders().slice(startIndex, startIndex + limit);

    return this.api.get<Order[]>('orders', {
      params: { page, limit },
      mock: {
        data: orders,
        delayMs: 0,
        message: 'Mock orders loaded successfully.',
      },
    });
  }

  getOrder(orderId: string): Observable<ApiResponse<Order>> {
    const order = this._orders().find((item) => item.id === orderId);

    if (!order) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Mock order not found.',
        code: 404,
      };

      return of(errorResponse).pipe(delay(0));
    }

    return this.api.get<Order>(`orders/${orderId}`, {
      mock: {
        data: order,
        delayMs: 0,
        message: 'Mock order loaded successfully.',
      },
    });
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

    const order: Order = {
      id: `order-${Date.now()}`,
      userId: 'user-mock-user',
      status: 'PENDING',
      total: cart.total,
      createdAt: new Date().toISOString(),
    };

    this._orders.update((orders) => [order, ...orders]);

    return this.api.post<Order>(
      'orders',
      {
        items: cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      },
      {
        mock: {
          data: order,
          delayMs: 0,
          message: 'Mock order created successfully.',
        },
      },
    );
  }
}
