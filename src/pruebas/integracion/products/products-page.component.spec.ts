import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductsPageComponent } from 'app/features/products/pages/products-page.component';
import { ProductsService } from 'app/features/products/services/products.service';
import { CartStateService } from 'app/features/cart/services/cart-state.service';
import { ToastService } from 'app/shared/ui/toast/toast.service';
import { ProductModalService } from 'app/features/products/services/product-modal.service';

describe('ProductsPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsPageComponent],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            listProducts: () =>
              of({
                count: 1,
                products: [
                  {
                    id: '1',
                    backendId: 1,
                    name: 'Ethiopian Yirgacheffe',
                    price: 26,
                    image: 'https://example.com/yirgacheffe.jpg',
                    category: 'Coffee',
                    description: null,
                    stock: 12,
                    availability: 'IN_STOCK',
                  },
                ],
              }),
          },
        },
        {
          provide: CartStateService,
          useValue: {
            addItem: vi.fn(),
            closeDrawer: vi.fn(),
          },
        },
        {
          provide: ToastService,
          useValue: {
            show: vi.fn(),
          },
        },
        {
          provide: ProductModalService,
          useValue: {
            open: vi.fn(),
            close: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('renders products returned by the API-backed products service', async () => {
    const fixture = TestBed.createComponent(ProductsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Ethiopian Yirgacheffe');
    expect(compiled.querySelector('[data-cy="products-empty"]')).toBeNull();
  });
});
