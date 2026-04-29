import { computed, inject, Injectable, signal } from '@angular/core';
import { map, of, switchMap, tap, type Observable } from 'rxjs';

import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type { Cart, CartItem } from '../../../core/models/cart.model';
import type { Order } from '../../../core/models/order.model';
import type { Product } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrdersService } from '../../orders/services/orders.service';

const INITIAL_CART_ITEMS: CartItem[] = [];
const FREE_SHIPPING = 0;

interface BackendCartItemResponse {
  id: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface BackendCartResponse {
  id: number;
  userId: number;
  totalItems: number;
  totalAmount: number;
  items: BackendCartItemResponse[];
}

@Injectable({
  providedIn: 'root',
})
export class CartStateService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly _cart = signal<Cart>(this.buildCart(INITIAL_CART_ITEMS));
  private readonly _isDrawerOpen = signal(false);

  readonly cart = this._cart.asReadonly();
  readonly isDrawerOpen = this._isDrawerOpen.asReadonly();
  readonly items = computed(() => this._cart().items);
  readonly itemCount = computed(() =>
    this._cart().items.reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly subtotal = computed(() => this._cart().subtotal);
  readonly shipping = computed(() => this._cart().shipping);
  readonly total = computed(() => this._cart().total);

  loadCart(): Observable<ApiResponse<Cart>> {
    if (!this.authService.isAuthenticated()) {
      const emptyCart = this.buildCart([]);
      this._cart.set(emptyCart);
      return of({
        success: true,
        data: emptyCart,
        message: 'Cart requires an authenticated session.',
      });
    }

    return this.api
      .get<BackendCartResponse>('cart')
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response)));
  }

  openDrawer(): void {
    this._isDrawerOpen.set(true);
  }

  closeDrawer(): void {
    this._isDrawerOpen.set(false);
  }

  toggleDrawer(): void {
    this._isDrawerOpen.update((isOpen) => !isOpen);
  }

  addItem(product: Product, quantity = 1): Observable<ApiResponse<Cart>> {
    const unauthorized = this.requireAuthenticatedCartAction();
    if (unauthorized) {
      return of(unauthorized);
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const currentCart = this._cart();
    this.openDrawer();

    return this.api
      .post<BackendCartResponse>('cart/items', {
        productId: product.backendId,
        quantity: normalizedQuantity,
      })
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  updateQuantity(itemId: string, quantity: number): Observable<ApiResponse<Cart>> {
    const unauthorized = this.requireAuthenticatedCartAction();
    if (unauthorized) {
      return of(unauthorized);
    }

    const currentCart = this._cart();
    const currentItem = currentCart.items.find((item) => item.itemId === itemId);

    if (!currentItem) {
      return of({
        success: false,
        error: 'Cart item not found.',
        code: 404,
      });
    }

    if (quantity <= 0) {
      return this.removeItem(itemId);
    }

    return this.api
      .put<BackendCartResponse>(`cart/items/${itemId}`, { quantity })
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  removeItem(itemId: string): Observable<ApiResponse<Cart>> {
    const unauthorized = this.requireAuthenticatedCartAction();
    if (unauthorized) {
      return of(unauthorized);
    }

    const currentCart = this._cart();
    return this.api
      .delete<BackendCartResponse>(`cart/items/${itemId}`)
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  clear(): void {
    this._cart.set(this.buildCart([]));
  }

  clearCart(): Observable<ApiResponse<Cart>> {
    const unauthorized = this.requireAuthenticatedCartAction();
    if (unauthorized) {
      this.clear();
      return of(unauthorized);
    }

    const currentCart = this._cart();
    return this.api
      .delete<BackendCartResponse>('cart')
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  checkout(): Observable<ApiResponse<Order>> {
    const unauthorized = this.requireAuthenticatedCartAction();
    if (unauthorized) {
      return of(unauthorized as ApiResponse<Order>);
    }

    return this.ordersService.createOrderFromCart(this._cart()).pipe(
      switchMap((response) => {
        if (!isApiSuccessResponse(response)) {
          return of(response);
        }

        return this.clearCart().pipe(
          map(() => {
            this.clear();
            this.closeDrawer();
            return response;
          }),
        );
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
      subtotal: normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
      shipping: normalizedItems.length > 0 ? FREE_SHIPPING : 0,
      total:
        normalizedItems.reduce((sum, item) => sum + item.subtotal, 0) +
        (normalizedItems.length > 0 ? FREE_SHIPPING : 0),
    };
  }

  private requireAuthenticatedCartAction(): ApiErrorResponse | null {
    if (this.authService.isAuthenticated()) {
      return null;
    }

    return {
      success: false,
      error: 'Sign in to manage your cart.',
      code: 401,
    };
  }

  private toCartResponse(response: ApiResponse<BackendCartResponse>): ApiResponse<Cart> {
    if (!isApiSuccessResponse(response)) {
      return response;
    }

    return {
      ...response,
      data: this.toCart(response.data),
    };
  }

  private toCart(cart: BackendCartResponse): Cart {
    return {
      items: cart.items.map((item) => ({
        itemId: String(item.id),
        productId: String(item.productId),
        backendProductId: item.productId,
        name: item.productName,
        category: 'Product',
        image: item.imageUrl ?? '',
        selectionLabel: 'Selected item',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        subtotal: Number(item.subtotal),
      })),
      subtotal: Number(cart.totalAmount),
      shipping: FREE_SHIPPING,
      total: Number(cart.totalAmount) + FREE_SHIPPING,
    };
  }

  private syncCartState(response: ApiResponse<Cart>, fallbackCart?: Cart): void {
    if (isApiSuccessResponse(response)) {
      this._cart.set(response.data);
      return;
    }

    if (fallbackCart) {
      this._cart.set(fallbackCart);
    }
  }
}
