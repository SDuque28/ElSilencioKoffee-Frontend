import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ProductsPageComponent } from './products-page.component';
import { ProductsService } from '../services/products.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { ProductModalService } from '../services/product-modal.service';

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
                    stock: null,
                  },
                ],
              }),
          },
        },
        {
          provide: CartStateService,
          useValue: {
            addItem: vi.fn(),
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
