import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { CartPageComponent } from './cart-page.component';
import { CartStateService } from '../services/cart-state.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

describe('CartPageComponent', () => {
  it('renders cart items returned by the API-backed cart service', async () => {
    const items = signal([
      {
        itemId: '55',
        productId: '1',
        backendProductId: 1,
        name: 'Ethiopian Yirgacheffe',
        category: 'Product',
        image: 'https://example.com/yirgacheffe.jpg',
        selectionLabel: 'Selected item',
        quantity: 1,
        unitPrice: 26,
        subtotal: 26,
      },
    ]);

    const loadCart = vi.fn(() =>
      of({
        success: true as const,
        data: {
          items: items(),
          subtotal: 26,
          shipping: 0,
          total: 26,
        },
        message: 'ok',
      }),
    );

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        {
          provide: CartStateService,
          useValue: {
            loadCart,
            updateQuantity: vi.fn(),
            checkout: vi.fn(),
            clearCart: vi.fn(),
            items,
            subtotal: signal(26),
            shipping: signal(0),
            total: signal(26),
          },
        },
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(loadCart).toHaveBeenCalled();
    expect(compiled.textContent).toContain('Ethiopian Yirgacheffe');
    expect(compiled.querySelector('[data-cy="cart-page-total"]')?.textContent).toContain('26.00');
  });

  it('renders the empty cart state safely', async () => {
    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        {
          provide: CartStateService,
          useValue: {
            loadCart: () =>
              of({
                success: true as const,
                data: {
                  items: [],
                  subtotal: 0,
                  shipping: 0,
                  total: 0,
                },
                message: 'ok',
              }),
            updateQuantity: vi.fn(),
            checkout: vi.fn(),
            clearCart: vi.fn(),
            items: signal([]),
            subtotal: signal(0),
            shipping: signal(0),
            total: signal(0),
          },
        },
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CartPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Your cart is empty.');
  });
});
