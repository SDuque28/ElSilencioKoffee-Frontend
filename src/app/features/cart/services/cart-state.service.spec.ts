import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { type ApiResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { PRODUCT_IMAGE_FALLBACK } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrdersService } from '../../orders/services/orders.service';
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
  };

  const sampleProduct: Product = {
    id: '1',
    backendId: 1,
    name: 'Ethiopian Yirgacheffe',
    price: 26,
    image: 'https://example.com/yirgacheffe.jpg',
    category: 'Coffee',
    description: null,
    stock: null,
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
    apiService = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    };

    authService = {
      isAuthenticated: vi.fn(() => true),
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
        {
          provide: OrdersService,
          useValue: {
            createOrderFromCart: vi.fn(),
          },
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

  it('returns an empty cart without calling the API when unauthenticated', async () => {
    authService.isAuthenticated.mockReturnValue(false);

    const response = await firstValueFrom(service.loadCart());

    expect(apiService.get).not.toHaveBeenCalled();
    expect(response.success).toBe(true);
    expect(service.items()).toEqual([]);
  });

  it('adds a product through the backend cart items endpoint', async () => {
    apiService.post.mockReturnValue(
      of({
        success: true,
        data: backendCartResponse,
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.addItem(sampleProduct, 2));

    expect(apiService.post).toHaveBeenCalledWith('cart/items', {
      productId: 1,
      quantity: 2,
    });
    expect(response.success).toBe(true);
  });

  it('updates quantity and removes items through backend endpoints', async () => {
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

  it('clears the cart through the backend endpoint', async () => {
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

  it('rejects cart mutations when there is no authenticated session', async () => {
    authService.isAuthenticated.mockReturnValue(false);

    const response = await firstValueFrom(service.addItem(sampleProduct));

    expect(apiService.post).not.toHaveBeenCalled();
    expect(response).toEqual({
      success: false,
      error: 'Sign in to manage your cart.',
      code: 401,
    });
  });
});
