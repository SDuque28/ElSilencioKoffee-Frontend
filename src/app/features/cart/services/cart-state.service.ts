import { computed, inject, Injectable, signal } from '@angular/core';
import { of, tap, type Observable } from 'rxjs';

import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type { Cart, CartItem } from '../../../core/models/cart.model';
import type { Order } from '../../../core/models/order.model';
import { ApiService } from '../../../core/services/api.service';
import { OrdersService } from '../../orders/services/orders.service';

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    itemId: 'item-ethiopian-yirgacheffe',
    productId: 'ethiopian-yirgacheffe',
    name: 'Ethiopian Yirgacheffe',
    quantity: 1,
    unitPrice: 26,
    subtotal: 26,
  },
  {
    itemId: 'item-ceramic-mug',
    productId: 'ceramic-mug',
    name: 'Ceramic Mug',
    quantity: 2,
    unitPrice: 16,
    subtotal: 32,
  },
];

@Injectable({
  providedIn: 'root',
})
export class CartStateService {
  private readonly api = inject(ApiService);
  private readonly ordersService = inject(OrdersService);
  private readonly _cart = signal<Cart>(this.buildCart(INITIAL_CART_ITEMS));

  readonly cart = this._cart.asReadonly();
  readonly items = computed(() => this._cart().items);
  readonly total = computed(() => this._cart().total);

  loadCart(): Observable<ApiResponse<Cart>> {
    return this.api.get<Cart>('cart', {
      mock: {
        data: this._cart(),
        delayMs: 0,
        message: 'Mock cart loaded successfully.',
      },
    });
  }

  updateQuantity(itemId: string, quantity: number): Observable<ApiResponse<Cart>> {
    const currentCart = this._cart();
    const currentItem = currentCart.items.find((item) => item.itemId === itemId);

    if (!currentItem) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Cart item not found.',
        code: 404,
      };

      return of(errorResponse);
    }

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    const nextItems = currentCart.items.map((item) =>
      item.itemId === itemId
        ? {
            ...item,
            quantity,
            subtotal: item.unitPrice * quantity,
          }
        : item,
    );

    const nextCart = this.buildCart(nextItems);

    return this.api
      .patch<Cart>(
        `cart/items/${itemId}`,
        { quantity },
        {
          mock: {
            data: nextCart,
            delayMs: 0,
            message: 'Mock cart item quantity updated successfully.',
          },
        },
      )
      .pipe(tap((response) => this.syncCartState(response)));
  }

  removeItem(itemId: string): Observable<ApiResponse<Cart>> {
    const nextCart = this.buildCart(this._cart().items.filter((item) => item.itemId !== itemId));

    return this.api
      .delete<Cart>(`cart/items/${itemId}`, {
        mock: {
          data: nextCart,
          delayMs: 0,
          message: 'Mock cart item removed successfully.',
        },
      })
      .pipe(tap((response) => this.syncCartState(response)));
  }

  clear(): void {
    this._cart.set(this.buildCart([]));
  }

  checkout(): Observable<ApiResponse<Order>> {
    return this.ordersService.createOrderFromCart(this._cart()).pipe(
      tap((response) => {
        if (isApiSuccessResponse(response)) {
          this.clear();
        }
      }),
    );
  }

  private buildCart(items: CartItem[]): Cart {
    const normalizedItems = items.map((item) => ({
      ...item,
      subtotal: item.unitPrice * item.quantity,
    }));

    return {
      items: normalizedItems,
      total: normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
    };
  }

  private syncCartState(response: ApiResponse<Cart>): void {
    if (isApiSuccessResponse(response)) {
      this._cart.set(response.data);
    }
  }
}
