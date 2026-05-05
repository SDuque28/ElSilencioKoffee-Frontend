import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize, map, of, shareReplay, switchMap, tap, type Observable } from 'rxjs';

import {
  isApiSuccessResponse,
  type ApiResponse,
} from '../../../core/models/api-response.model';
import type { Cart, CartItem } from '../../../core/models/cart.model';
import { PRODUCT_IMAGE_FALLBACK, type Product } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

const GUEST_CART_STORAGE_KEY = 'esk.guest-cart';
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

  private readonly _cart = signal<Cart>(this.buildCart(INITIAL_CART_ITEMS));
  private readonly _isDrawerOpen = signal(false);
  private pendingCartLoad$: Observable<ApiResponse<Cart>> | null = null;

  readonly cart = this._cart.asReadonly();
  readonly isDrawerOpen = this._isDrawerOpen.asReadonly();
  readonly items = computed(() => this._cart().items);
  readonly itemCount = computed(() =>
    this._cart().items.reduce((sum, item) => sum + item.quantity, 0),
  );
  readonly subtotal = computed(() => this._cart().subtotal);
  readonly shipping = computed(() => this._cart().shipping);
  readonly total = computed(() => this._cart().total);

  constructor() {
    this.restoreCartState();
  }

  loadCart(): Observable<ApiResponse<Cart>> {
    if (this.pendingCartLoad$) {
      return this.pendingCartLoad$;
    }

    const request$ = this.createCartLoadRequest().pipe(
      finalize(() => {
        this.pendingCartLoad$ = null;
      }),
      shareReplay(1),
    );

    this.pendingCartLoad$ = request$;
    return request$;
  }

  restoreCartState(): void {
    this.loadCart().subscribe({
      error: () => {
        this._cart.set(this.buildCart([]));
      },
    });
  }

  private createCartLoadRequest(): Observable<ApiResponse<Cart>> {
    if (!this.authService.isAuthenticated()) {
      const localCart = this.readGuestCart();
      this._cart.set(localCart);
      return of(this.successResponse(localCart, 'Guest cart restored from local storage.'));
    }

    const guestCart = this.readGuestCart();
    if (guestCart.items.length > 0) {
      return this.mergeGuestCartIntoBackend(guestCart);
    }

    return this.loadPersistedCart();
  }

  private loadPersistedCart(): Observable<ApiResponse<Cart>> {
    return this.api
      .get<BackendCartResponse>('cart')
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response)));
  }

  private mergeGuestCartIntoBackend(guestCart: Cart): Observable<ApiResponse<Cart>> {
    let mergeRequest$: Observable<ApiResponse<Cart>> = of(
      this.successResponse(this._cart(), 'Guest cart merge initialized.'),
    );

    for (const item of guestCart.items) {
      mergeRequest$ = mergeRequest$.pipe(
        switchMap((previousResponse) => {
          if (!isApiSuccessResponse(previousResponse)) {
            return of(previousResponse);
          }

          return this.api
            .post<BackendCartResponse>('cart/items', {
              productId: item.backendProductId,
              quantity: item.quantity,
            })
            .pipe(map((response) => this.toCartResponse(response)));
        }),
      );
    }

    return mergeRequest$.pipe(
      switchMap((response) => {
        if (!isApiSuccessResponse(response)) {
          return of(response);
        }

        localStorage.removeItem(GUEST_CART_STORAGE_KEY);
        return this.loadPersistedCart();
      }),
    );
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
    if (!this.authService.isAuthenticated()) {
      return of(this.addGuestItem(product, quantity));
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
    if (this.isGuestItemId(itemId)) {
      return of(this.updateGuestItemQuantity(itemId, quantity));
    }

    if (!this.authService.isAuthenticated()) {
      return of(this.updateGuestItemQuantity(itemId, quantity));
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
    if (this.isGuestItemId(itemId)) {
      return of(this.removeGuestItem(itemId));
    }

    if (!this.authService.isAuthenticated()) {
      return of(this.removeGuestItem(itemId));
    }

    const currentCart = this._cart();
    return this.api
      .delete<BackendCartResponse>(`cart/items/${itemId}`)
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  clear(): void {
    const emptyCart = this.buildCart([]);
    this._cart.set(emptyCart);
    if (!this.authService.isAuthenticated()) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    }
  }

  clearCart(): Observable<ApiResponse<Cart>> {
    if (!this.authService.isAuthenticated()) {
      this.clear();
      return of(this.successResponse(this._cart(), 'Guest cart cleared.'));
    }

    const currentCart = this._cart();
    return this.api
      .delete<BackendCartResponse>('cart')
      .pipe(map((response) => this.toCartResponse(response)))
      .pipe(tap((response) => this.syncCartState(response, currentCart)));
  }

  private addGuestItem(product: Product, quantity: number): ApiResponse<Cart> {
    if (product.availability === 'OUT_OF_STOCK' || product.stock <= 0) {
      return {
        success: false,
        error: 'This product is currently out of stock.',
        code: 400,
      };
    }

    const normalizedQuantity = Math.max(1, Math.floor(quantity));
    const currentItems = [...this._cart().items];
    const existingIndex = currentItems.findIndex(
      (item) => item.backendProductId === product.backendId,
    );

    if (existingIndex >= 0) {
      const existingItem = currentItems[existingIndex];
      currentItems[existingIndex] = {
        ...existingItem,
        quantity: existingItem.quantity + normalizedQuantity,
        subtotal: existingItem.unitPrice * (existingItem.quantity + normalizedQuantity),
      };
    } else {
      currentItems.push(this.toGuestCartItem(product, normalizedQuantity));
    }

    const nextCart = this.buildCart(currentItems);
    this.persistGuestCart(nextCart);
    this._cart.set(nextCart);
    this.openDrawer();

    return this.successResponse(nextCart, 'Product added to guest cart.');
  }

  private updateGuestItemQuantity(itemId: string, quantity: number): ApiResponse<Cart> {
    const currentItems = [...this._cart().items];
    const itemIndex = currentItems.findIndex((item) => item.itemId === itemId);

    if (itemIndex < 0) {
      return {
        success: false,
        error: 'Cart item not found.',
        code: 404,
      };
    }

    if (quantity <= 0) {
      return this.removeGuestItem(itemId);
    }

    const currentItem = currentItems[itemIndex];
    currentItems[itemIndex] = {
      ...currentItem,
      quantity,
      subtotal: currentItem.unitPrice * quantity,
    };

    const nextCart = this.buildCart(currentItems);
    this.persistGuestCart(nextCart);
    this._cart.set(nextCart);
    return this.successResponse(nextCart, 'Guest cart updated.');
  }

  private removeGuestItem(itemId: string): ApiResponse<Cart> {
    const nextCart = this.buildCart(this._cart().items.filter((item) => item.itemId !== itemId));
    this.persistGuestCart(nextCart);
    this._cart.set(nextCart);
    return this.successResponse(nextCart, 'Item removed from guest cart.');
  }

  private toGuestCartItem(product: Product, quantity: number): CartItem {
    return {
      itemId: `guest-${product.backendId}`,
      productId: String(product.id),
      backendProductId: product.backendId,
      name: product.name,
      category: product.category ?? 'Product',
      image: product.image?.trim() || PRODUCT_IMAGE_FALLBACK,
      selectionLabel: 'Selected item',
      quantity,
      unitPrice: product.price,
      subtotal: product.price * quantity,
    };
  }

  private readGuestCart(): Cart {
    const rawValue = localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!rawValue) {
      return this.buildCart([]);
    }

    try {
      const parsedItems = JSON.parse(rawValue) as CartItem[];
      if (!Array.isArray(parsedItems)) {
        return this.buildCart([]);
      }

      return this.buildCart(parsedItems);
    } catch {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      return this.buildCart([]);
    }
  }

  private persistGuestCart(cart: Cart): void {
    const guestItems = cart.items.filter((item) => this.isGuestItemId(item.itemId));

    if (guestItems.length === 0) {
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      return;
    }

    localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(guestItems));
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
    const items = cart.items.map((item) => {
      const unitPrice = this.toNumber(item.unitPrice);
      const quantity = Math.max(0, Math.floor(this.toNumber(item.quantity)));
      const subtotal = this.toNumber(item.subtotal, unitPrice * quantity);

      return {
        itemId: String(item.id),
        productId: String(item.productId),
        backendProductId: item.productId,
        name: item.productName,
        category: 'Product',
        image: item.imageUrl?.trim() || PRODUCT_IMAGE_FALLBACK,
        selectionLabel: 'Selected item',
        quantity,
        unitPrice,
        subtotal,
      };
    });

    const subtotal = this.toNumber(
      cart.totalAmount,
      items.reduce((sum, item) => sum + item.subtotal, 0),
    );

    return {
      items,
      subtotal,
      shipping: FREE_SHIPPING,
      total: subtotal + FREE_SHIPPING,
    };
  }

  private toNumber(value: unknown, fallback = 0): number {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : fallback;
  }

  private syncCartState(response: ApiResponse<Cart>, fallbackCart?: Cart): void {
    if (isApiSuccessResponse(response)) {
      this._cart.set(response.data);
      return;
    }

    if (response.code === 401 && this.authService.isAuthenticated()) {
      this.authService.clearSession();
      const guestCart = this.readGuestCart();
      this._cart.set(guestCart);
      return;
    }

    if (fallbackCart) {
      this._cart.set(fallbackCart);
    }
  }

  private isGuestItemId(itemId: string): boolean {
    return itemId.startsWith('guest-');
  }

  private successResponse(data: Cart, message: string): ApiResponse<Cart> {
    return {
      success: true,
      data,
      message,
    };
  }
}
