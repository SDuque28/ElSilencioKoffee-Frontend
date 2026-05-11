import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { PRODUCT_IMAGE_FALLBACK } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { CartStateService } from './cart-state.service';

describe('CartStateService', () => {
  let service: CartStateService;
  let apiService: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };

  const sampleProduct: Product = {
    id: '1',
    backendId: 1,
    name: 'Ethiopian Yirgacheffe',
    price: 26,
    image: 'https://example.com/yirgacheffe.jpg',
    category: 'Coffee',
    description: null,
    stock: 8,
    availability: 'IN_STOCK',
  };

  const backendCartResponse = {
    id: 10,
    userId: 2,
    totalItems: 1,
    totalAmount: 26,
    items: [
      {
        id: 55,
        productId: 1,
        productName: 'Ethiopian Yirgacheffe',
        imageUrl: null,
        unitPrice: 26,
        quantity: 1,
        subtotal: 26,
      },
    ],
  };

  beforeEach(() => {
    localStorage.clear();

    apiService = {
      get: vi.fn(() =>
        of({
          success: true,
          data: {
            id: 0,
            userId: 0,
            totalItems: 0,
            totalAmount: 0,
            items: [],
          },
          message: 'ok',
        } satisfies ApiResponse<unknown>),
      ),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    authService = {
      isAuthenticated: vi.fn(() => true),
      clearSession: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        CartStateService,
        {
          provide: ApiService,
          useValue: apiService,
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    });

    service = TestBed.inject(CartStateService);
  });

  it('loads the authenticated user cart from the backend', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: backendCartResponse,
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.loadCart());

    expect(apiService.get).toHaveBeenCalledWith('cart');
    expect(response.success).toBe(true);
    expect(service.items()[0]).toMatchObject({
      itemId: '55',
      productId: '1',
      backendProductId: 1,
      image: PRODUCT_IMAGE_FALLBACK,
      quantity: 1,
      unitPrice: 26,
      subtotal: 26,
    });
  });

  it('stores guest cart items locally when there is no authenticated session', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();

    const response = await firstValueFrom(service.addItem(sampleProduct, 2));

    expect(apiService.post).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(service.items()).toHaveLength(1);
    expect(service.items()[0]).toMatchObject({
      itemId: 'guest-1',
      backendProductId: 1,
      quantity: 2,
      subtotal: 52,
    });
    expect(JSON.parse(localStorage.getItem('esk.guest-cart') ?? '[]')).toHaveLength(1);
  });

  it('restores the guest cart from local storage when unauthenticated', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();
    localStorage.setItem(
      'esk.guest-cart',
      JSON.stringify([
        {
          itemId: 'guest-1',
          productId: '1',
          backendProductId: 1,
          name: 'Ethiopian Yirgacheffe',
          category: 'Coffee',
          image: 'https://example.com/yirgacheffe.jpg',
          selectionLabel: 'Selected item',
          quantity: 2,
          unitPrice: 26,
          subtotal: 52,
        },
      ]),
    );

    const response = await firstValueFrom(service.loadCart());

    expect(apiService.get).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(service.items()[0]?.quantity).toBe(2);
    expect(service.total()).toBe(52);
  });

  it('merges guest cart items into the backend cart after authentication', async () => {
    authService.isAuthenticated.mockReturnValue(true);
    apiService.get.mockClear();
    localStorage.setItem(
      'esk.guest-cart',
      JSON.stringify([
        {
          itemId: 'guest-1',
          productId: '1',
          backendProductId: 1,
          name: 'Ethiopian Yirgacheffe',
          category: 'Coffee',
          image: 'https://example.com/yirgacheffe.jpg',
          selectionLabel: 'Selected item',
          quantity: 2,
          unitPrice: 26,
          subtotal: 52,
        },
      ]),
    );
    apiService.post.mockReturnValue(
      of({
        success: true,
        data: backendCartResponse,
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: {
          ...backendCartResponse,
          totalItems: 2,
          totalAmount: 52,
          items: [
            {
              ...backendCartResponse.items[0],
              quantity: 2,
              subtotal: 52,
            },
          ],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.loadCart());

    expect(apiService.post).toHaveBeenCalledWith('cart/items', {
      productId: 1,
      quantity: 2,
    });
    expect(apiService.get).toHaveBeenCalledWith('cart');
    expect(response.success).toBe(true);
    expect(service.items()[0]?.itemId).toBe('55');
    expect(localStorage.getItem('esk.guest-cart')).toBeNull();
  });

  it('updates and removes guest cart items without backend calls', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();
    await firstValueFrom(service.addItem(sampleProduct, 2));

    await firstValueFrom(service.updateQuantity('guest-1', 3));
    expect(service.items()[0]?.quantity).toBe(3);

    await firstValueFrom(service.removeItem('guest-1'));
    expect(service.items()).toEqual([]);
    expect(localStorage.getItem('esk.guest-cart')).toBeNull();
  });

  it('removes guest items locally even if the user is authenticated', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();
    await firstValueFrom(service.addItem(sampleProduct, 2));
    authService.isAuthenticated.mockReturnValue(true);
    const response = await firstValueFrom(service.removeItem('guest-1'));

    expect(apiService.delete).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(service.items()).toEqual([]);
  });

  it('updates guest items locally even if the user is authenticated', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();
    await firstValueFrom(service.addItem(sampleProduct, 2));
    authService.isAuthenticated.mockReturnValue(true);

    const response = await firstValueFrom(service.updateQuantity('guest-1', 4));

    expect(apiService.put).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(service.items()[0]?.quantity).toBe(4);
    expect(JSON.parse(localStorage.getItem('esk.guest-cart') ?? '[]')).toMatchObject([
      expect.objectContaining({
        itemId: 'guest-1',
        quantity: 4,
      }),
    ]);
  });

  it('updates quantity and removes persisted items through backend endpoints', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: backendCartResponse,
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );
    apiService.put.mockReturnValue(
      of({
        success: true,
        data: {
          ...backendCartResponse,
          totalAmount: 52,
          items: [
            {
              ...backendCartResponse.items[0],
              quantity: 2,
              subtotal: 52,
            },
          ],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );
    apiService.delete.mockReturnValue(
      of({
        success: true,
        data: {
          ...backendCartResponse,
          totalAmount: 0,
          items: [],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    await firstValueFrom(service.loadCart());
    await firstValueFrom(service.updateQuantity('55', 2));
    await firstValueFrom(service.removeItem('55'));

    expect(apiService.put).toHaveBeenCalledWith('cart/items/55', { quantity: 2 });
    expect(apiService.delete).toHaveBeenCalledWith('cart/items/55');
    expect(service.items()).toEqual([]);
  });

  it('clears the guest cart locally when unauthenticated', async () => {
    authService.isAuthenticated.mockReturnValue(false);
    apiService.get.mockClear();
    await firstValueFrom(service.addItem(sampleProduct, 1));

    const response = await firstValueFrom(service.clearCart());

    expect(response.success).toBe(true);
    expect(service.items()).toEqual([]);
    expect(localStorage.getItem('esk.guest-cart')).toBeNull();
  });

  it('clears the authenticated cart through the backend endpoint', async () => {
    apiService.delete.mockReturnValue(
      of({
        success: true,
        data: {
          ...backendCartResponse,
          totalAmount: 0,
          items: [],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.clearCart());

    expect(apiService.delete).toHaveBeenCalledWith('cart');
    expect(response.success).toBe(true);
    expect(service.items()).toEqual([]);
  });

  it('clears the session and falls back safely when the persisted cart returns 401', async () => {
    apiService.get.mockReturnValue(
      of({
        success: false,
        error: 'Unauthorized',
        code: 401,
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.loadCart());

    expect(authService.clearSession).toHaveBeenCalled();
    expect(response.success).toBe(false);
    expect(service.items()).toEqual([]);
  });
});
