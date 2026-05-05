import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';

import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { OrdersService } from '../../orders/services/orders.service';
import { CheckoutPageComponent } from './checkout-page.component';

describe('CheckoutPageComponent', () => {
  const cartStateStub = {
    loadCart: vi.fn(() =>
      of({
        success: true as const,
        data: {
          items: [
            {
              itemId: '55',
              productId: '1',
              backendProductId: 1,
              name: 'Ethiopian Yirgacheffe',
              category: 'Coffee',
              image: '/coffee.jpg',
              selectionLabel: 'Selected item',
              quantity: 1,
              unitPrice: 26,
              subtotal: 26,
            },
          ],
          subtotal: 26,
          shipping: 0,
          total: 26,
        },
        message: 'ok',
      }),
    ),
    restoreCartState: vi.fn(),
    items: signal([
      {
        itemId: '55',
        productId: '1',
        backendProductId: 1,
        name: 'Ethiopian Yirgacheffe',
        category: 'Coffee',
        image: '/coffee.jpg',
        selectionLabel: 'Selected item',
        quantity: 1,
        unitPrice: 26,
        subtotal: 26,
      },
    ]),
    subtotal: signal(26),
    shipping: signal(0),
    total: signal(26),
  };

  beforeEach(() => {
    cartStateStub.loadCart.mockClear();
    cartStateStub.restoreCartState.mockClear();
  });

  it('validates required fields before calling the checkout API', async () => {
    const ordersService = { checkout: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartStateService,
          useValue: cartStateStub,
        },
        {
          provide: OrdersService,
          useValue: ordersService,
        },
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();

    fixture.componentInstance.submit();

    expect(ordersService.checkout).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('submits the checkout payload and redirects on success', async () => {
    const ordersService = {
      checkout: vi.fn(() =>
        of({
          success: true as const,
          data: {
            orderId: 88,
            orderDate: '2026-05-04T10:45:00Z',
            orderStatus: 'PAID',
            totalAmount: 26,
            notes: 'Leave with concierge.',
            items: [],
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
              id: 12,
              status: 'OUT_FOR_SHIPMENT',
              createdAt: '2026-05-04T10:46:00Z',
              updatedAt: '2026-05-04T10:46:00Z',
            },
          },
          message: 'ok',
        }),
      ),
    };
    const toastService = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartStateService,
          useValue: cartStateStub,
        },
        {
          provide: OrdersService,
          useValue: ordersService,
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CheckoutPageComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.detectChanges();

    fixture.componentInstance.form.setValue({
      address: 'Street 123',
      country: 'Colombia',
      city: 'Bogota',
      neighborhood: 'Usaquen',
      referenceDetails: 'Blue door',
      paymentMethod: 'CREDIT_CARD',
      cardholderName: 'Test Buyer',
      cardNumber: '4242424242424242',
      expirationDate: '12/29',
      cvv: '123',
      notes: 'Leave with concierge.',
    });

    fixture.componentInstance.submit();

    expect(ordersService.checkout).toHaveBeenCalledWith({
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
      notes: 'Leave with concierge.',
    });
    expect(cartStateStub.restoreCartState).toHaveBeenCalled();
    expect(toastService.show).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/orders', 88]);
  });
});
