import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { provideRouter, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';

import { AuthService } from 'app/core/services/auth.service';
import { ToastService } from 'app/shared/ui/toast/toast.service';
import { ProductModalService } from 'app/features/products/services/product-modal.service';
import { CartStateService } from 'app/features/cart/services/cart-state.service';
import { CartDrawerComponent } from 'app/features/cart/components/cart-drawer.component';

describe('CartDrawerComponent', () => {
  it('renders the empty state cleanly', async () => {
    await TestBed.configureTestingModule({
      imports: [CartDrawerComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartStateService,
          useValue: {
            loadCart: () =>
              of({
                success: true as const,
                data: { items: [], subtotal: 0, shipping: 0, total: 0 },
                message: 'ok',
              }),
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            isDrawerOpen: signal(true),
            items: signal([]),
            itemCount: signal(0),
            subtotal: signal(0),
            shipping: signal(0),
            total: signal(0),
            closeDrawer: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: vi.fn(() => false),
          },
        },
        {
          provide: ProductModalService,
          useValue: {
            isOpen: signal(false),
          },
        },
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CartDrawerComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Your cart is empty');
  });

  it('redirects unauthenticated users to login when continuing to checkout', async () => {
    const toastService = { show: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [CartDrawerComponent],
      providers: [
        provideRouter([]),
        {
          provide: CartStateService,
          useValue: {
            loadCart: () =>
              of({
                success: true as const,
                data: { items: [], subtotal: 0, shipping: 0, total: 0 },
                message: 'ok',
              }),
            updateQuantity: vi.fn(),
            removeItem: vi.fn(),
            isDrawerOpen: signal(true),
            items: signal([
              {
                itemId: 'guest-1',
                productId: '1',
                backendProductId: 1,
                name: 'Guest Coffee',
                category: 'Coffee',
                image: '/coffee.jpg',
                selectionLabel: 'Selected item',
                quantity: 1,
                unitPrice: 26,
                subtotal: 26,
              },
            ]),
            itemCount: signal(1),
            subtotal: signal(26),
            shipping: signal(0),
            total: signal(26),
            closeDrawer: vi.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: vi.fn(() => false),
          },
        },
        {
          provide: ProductModalService,
          useValue: {
            isOpen: signal(false),
          },
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(CartDrawerComponent);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.checkout();

    expect(toastService.show).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: { redirectTo: '/checkout' },
    });
  });
});
