import { computed, inject, Injectable, signal } from '@angular/core';
import { of, tap, type Observable } from 'rxjs';

import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type { Cart, CartItem } from '../../../core/models/cart.model';
import type { Order } from '../../../core/models/order.model';
import type { Product } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';
import { OrdersService } from '../../orders/services/orders.service';

const INITIAL_CART_ITEMS: CartItem[] = [
  {
    itemId: 'item-ethiopian-yirgacheffe',
    productId: 'ethiopian-yirgacheffe',
    name: 'Ethiopian Yirgacheffe',
    category: 'Single Origin',
    image:
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80',
    selectionLabel: '250g',
    quantity: 1,
    unitPrice: 26,
    subtotal: 26,
  },
  {
    itemId: 'item-ceramic-mug',
    productId: 'ceramic-mug',
    name: 'Ceramic Mug',
    category: 'Accessories',
    image:
      'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=80',
    selectionLabel: '1 piece',
    quantity: 2,
    unitPrice: 16,
    subtotal: 32,
  },
];

const FREE_SHIPPING = 0;

@Injectable({
  providedIn: 'root',
})
export class CartStateService {
  private readonly api = inject(ApiService);
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
    return this.api
      .get<Cart>('cart', {
        mock: {
          data: this._cart(),
          delayMs: 0,
          message: 'Mock cart loaded successfully.',
        },
      })
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
    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const currentCart = this._cart();
    const existingItem = currentCart.items.find((item) => item.productId === product.id);
    const nextItems = existingItem
      ? currentCart.items.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + normalizedQuantity,
                subtotal: item.unitPrice * (item.quantity + normalizedQuantity),
              }
            : item,
        )
      : [...currentCart.items, this.createCartItem(product, normalizedQuantity)];
    const nextCart = this.buildCart(nextItems);

    this._cart.set(nextCart);
    this.openDrawer();

    return this.api
      .post<Cart>(
        'cart/items',
        {
          productId: product.id,
          quantity: normalizedQuantity,
        },
        {
          mock: {
            data: nextCart,
            delayMs: 0,
            message: 'Mock cart item added successfully.',
          },
        },
      )
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
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
    this._cart.set(nextCart);

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
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  removeItem(itemId: string): Observable<ApiResponse<Cart>> {
    const currentCart = this._cart();
    const nextCart = this.buildCart(currentCart.items.filter((item) => item.itemId !== itemId));

    this._cart.set(nextCart);

    return this.api
      .delete<Cart>(`cart/items/${itemId}`, {
        mock: {
          data: nextCart,
          delayMs: 0,
          message: 'Mock cart item removed successfully.',
        },
      })
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  clear(): void {
    this._cart.set(this.buildCart([]));
  }

  checkout(): Observable<ApiResponse<Order>> {
    return this.ordersService.createOrderFromCart(this._cart()).pipe(
      tap((response) => {
        if (isApiSuccessResponse(response)) {
          this.clear();
          this.closeDrawer();
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
      subtotal: normalizedItems.reduce((sum, item) => sum + item.subtotal, 0),
      shipping: normalizedItems.length > 0 ? FREE_SHIPPING : 0,
      total:
        normalizedItems.reduce((sum, item) => sum + item.subtotal, 0) +
        (normalizedItems.length > 0 ? FREE_SHIPPING : 0),
    };
  }

  private createCartItem(product: Product, quantity: number): CartItem {
    return {
      itemId: `item-${product.id}`,
      productId: product.id,
      name: product.name,
      category: product.category,
      image: product.image,
      selectionLabel: this.getSelectionLabel(product),
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity,
    };
  }

  private getSelectionLabel(product: Product): string {
    const normalizedCategory = product.category.toLowerCase();

    if (
      ['single origin', 'premium beans', 'house blend', 'blend'].includes(normalizedCategory)
    ) {
      return '250g';
    }

    if (normalizedCategory.includes('capsule')) {
      return '10 capsules';
    }

    if (normalizedCategory.includes('kit')) {
      return 'Complete kit';
    }

    if (normalizedCategory.includes('equipment')) {
      return '1 unit';
    }

    if (normalizedCategory.includes('accessories')) {
      return '1 piece';
    }

    return '1 unit';
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
