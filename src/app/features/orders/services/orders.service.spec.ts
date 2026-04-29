import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let apiService: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
  };
  let authService: {
    isAdmin: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    apiService = {
      get: vi.fn(),
      post: vi.fn(),
    };

    authService = {
      isAdmin: vi.fn(() => false),
    };

    TestBed.configureTestingModule({
      providers: [
        OrdersService,
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

    service = TestBed.inject(OrdersService);
  });

  it('maps user order history with detail lines from the backend', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: [
          {
            id: 77,
            orderDate: '2026-04-29T10:30:00Z',
            status: 'PENDING',
            totalAmount: 52,
            userId: 9,
            items: [
              {
                detailId: 1,
                productId: 5,
                productName: 'Barista Pro Grinder',
                quantity: 2,
                unitPrice: 26,
                subtotal: 52,
              },
            ],
          },
        ],
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.listOrders());

    expect(apiService.get).toHaveBeenCalledWith('users/me/orders', {
      baseUrl: '/api-auth',
    });
    expect(response.success).toBe(true);
    if (!response.success) {
      throw new Error('Expected success response');
    }
    expect(response.data.orders[0]).toEqual({
      id: 77,
      orderDate: '2026-04-29T10:30:00Z',
      status: 'PENDING',
      totalAmount: 52,
      userId: 9,
      items: [
        {
          detailId: 1,
          productId: 5,
          productName: 'Barista Pro Grinder',
          quantity: 2,
          unitPrice: 26,
          subtotal: 52,
        },
      ],
    });
  });

  it('posts the backend cart lines to create an order', async () => {
    apiService.post.mockReturnValue(
      of({
        success: true,
        data: {
          id: 88,
          orderDate: '2026-04-29T10:45:00Z',
          status: 'PENDING',
          totalAmount: 52,
          userId: 9,
          items: [],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(
      service.createOrderFromCart({
        items: [
          {
            itemId: '55',
            productId: '5',
            backendProductId: 5,
            name: 'Barista Pro Grinder',
            category: 'Equipment',
            image: 'https://example.com/grinder.jpg',
            selectionLabel: 'Selected item',
            quantity: 2,
            unitPrice: 26,
            subtotal: 52,
          },
        ],
        subtotal: 52,
        shipping: 0,
        total: 52,
      }),
    );

    expect(apiService.post).toHaveBeenCalledWith(
      'orders',
      {
        items: [
          {
            productId: 5,
            quantity: 2,
          },
        ],
      },
      {
        baseUrl: '/api-auth',
      },
    );
    expect(response.success).toBe(true);
  });

  it('calls the payment endpoint and maps the updated order', async () => {
    apiService.post.mockReturnValue(
      of({
        success: true,
        data: {
          id: 77,
          orderDate: '2026-04-29T10:30:00Z',
          status: 'PAID',
          totalAmount: 52,
          userId: 9,
          items: [
            {
              detailId: 1,
              productId: 5,
              productName: 'Barista Pro Grinder',
              quantity: 2,
              unitPrice: 26,
              subtotal: 52,
            },
          ],
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const response = await firstValueFrom(service.payOrder(77));

    expect(apiService.post).toHaveBeenCalledWith(
      'api/v1/orders/77/pay',
      {},
      {
        baseUrl: '/api-auth',
      },
    );
    expect(response.success).toBe(true);
    if (!response.success) {
      throw new Error('Expected success response');
    }
    expect(response.data.status).toBe('PAID');
    expect(response.data.items[0]?.subtotal).toBe(52);
  });
});
