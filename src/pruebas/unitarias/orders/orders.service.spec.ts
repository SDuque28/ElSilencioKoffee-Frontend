import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import type { ApiResponse } from 'app/core/models/api-response.model';
import type { CheckoutResult } from 'app/core/models/checkout.model';
import { ApiService } from 'app/core/services/api.service';
import { AuthService } from 'app/core/services/auth.service';
import { OrdersService } from 'app/features/orders/services/orders.service';

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

  it('maps user order history with full purchase details from the backend', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: [
          {
            id: 77,
            orderDate: '2026-05-04T10:30:00Z',
            status: 'PAID',
            totalAmount: 52,
            userId: 9,
            notes: 'Handle carefully.',
            shippingInformation: {
              address: 'Street 123',
              country: 'Colombia',
              city: 'Bogota',
              neighborhood: 'Usaquen',
              referenceDetails: 'Blue door',
            },
            payment: {
              paymentMethod: 'CREDIT_CARD',
              maskedCardNumber: '**** **** **** 4242',
              status: 'APPROVED',
              transactionReference: 'SIM-ORDER000077',
              paidAt: '2026-05-04T10:35:00Z',
            },
            deliveryOrder: {
              id: 14,
              status: 'OUT_FOR_SHIPMENT',
              createdAt: '2026-05-04T10:36:00Z',
              updatedAt: '2026-05-04T10:36:00Z',
            },
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
    expect(response.data.orders[0]?.payment?.maskedCardNumber).toBe('**** **** **** 4242');
    expect(response.data.orders[0]?.deliveryOrder?.status).toBe('OUT_FOR_SHIPMENT');
    expect(response.data.orders[0]?.shippingInformation?.city).toBe('Bogota');
  });

  it('uses the admin orders endpoint for administrators', async () => {
    authService.isAdmin.mockReturnValue(true);
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: [],
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    await firstValueFrom(service.listOrders());

    expect(apiService.get).toHaveBeenCalledWith('api/v1/admin/orders', {
      baseUrl: '/api-auth',
    });
  });

  it('posts the checkout payload and maps the confirmation response', async () => {
    apiService.post.mockReturnValue(
      of({
        success: true,
        data: {
          orderId: 88,
          orderDate: '2026-05-04T10:45:00Z',
          orderStatus: 'PAID',
          totalAmount: 52,
          notes: 'Call on arrival.',
          shippingInformation: {
            address: 'Street 123',
            country: 'Colombia',
            city: 'Bogota',
            neighborhood: 'Usaquen',
            referenceDetails: 'Blue door',
          },
          payment: {
            paymentMethod: 'CREDIT_CARD',
            maskedCardNumber: '**** **** **** 4242',
            status: 'APPROVED',
            transactionReference: 'SIM-ORDER000088',
            paidAt: '2026-05-04T10:45:00Z',
          },
          deliveryOrder: {
            id: 18,
            status: 'OUT_FOR_SHIPMENT',
            createdAt: '2026-05-04T10:46:00Z',
            updatedAt: '2026-05-04T10:46:00Z',
          },
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

    const response: ApiResponse<CheckoutResult> = await firstValueFrom(
      service.checkout({
        shippingInformation: {
          address: 'Street 123',
          country: 'Colombia',
          city: 'Bogota',
          neighborhood: 'Usaquen',
          referenceDetails: 'Blue door',
        },
        payment: {
          paymentMethod: 'CREDIT_CARD',
          cardholderName: 'Test Buyer',
          cardNumber: '4242424242424242',
          expirationDate: '12/29',
          cvv: '123',
        },
        notes: 'Call on arrival.',
      }),
    );

    const [endpoint, payload, options] = apiService.post.mock.calls[0] as [
      string,
      {
        shippingInformation: {
          city: string;
        };
        payment: {
          cardNumber: string;
        };
      },
      {
        baseUrl: string;
      },
    ];
    expect(endpoint).toBe('api/v1/checkout');
    expect(payload.shippingInformation.city).toBe('Bogota');
    expect(payload.payment.cardNumber).toBe('4242424242424242');
    expect(options).toEqual({
      baseUrl: '/api-auth',
    });
    expect(response.success).toBe(true);
    if (!response.success) {
      throw new Error('Expected success response');
    }
    const checkoutResult = response.data;
    expect(checkoutResult.payment.maskedCardNumber).toBe('**** **** **** 4242');
    expect(checkoutResult.deliveryOrder.status).toBe('OUT_FOR_SHIPMENT');
  });
});
