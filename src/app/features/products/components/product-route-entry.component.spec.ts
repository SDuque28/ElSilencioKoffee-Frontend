import { TestBed } from '@angular/core/testing';
import { convertToParamMap } from '@angular/router';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { ProductRouteEntryComponent } from './product-route-entry.component';
import { ProductsService } from '../services/products.service';
import { ProductModalService } from '../services/product-modal.service';

describe('ProductRouteEntryComponent', () => {
  function configureTestingModule(getProductResult: object | undefined): {
    navigateByUrl: ReturnType<typeof vi.fn>;
    open: ReturnType<typeof vi.fn>;
  } {
    const navigateByUrl = vi.fn().mockResolvedValue(true);
    const open = vi.fn();

    TestBed.configureTestingModule({
      imports: [ProductRouteEntryComponent],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            getProduct: vi.fn().mockReturnValue(of(getProductResult)),
          },
        },
        {
          provide: ProductModalService,
          useValue: {
            open,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
            },
          },
        },
        {
          provide: Router,
          useValue: {
            navigateByUrl,
            lastSuccessfulNavigation: () => null,
          },
        },
      ],
    });

    return { navigateByUrl, open };
  }

  it('loads the product by route id and opens the modal with backend data', async () => {
    const product = {
      id: '1',
      backendId: 1,
      name: 'Ethiopian Yirgacheffe',
      price: 26,
      image: 'https://example.com/yirgacheffe.jpg',
      category: 'Coffee',
      description: null,
      stock: 12,
      availability: 'IN_STOCK',
    };

    const { navigateByUrl, open } = configureTestingModule(product);
    const fixture = TestBed.createComponent(ProductRouteEntryComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(open).toHaveBeenCalledWith(product);
    expect(navigateByUrl).toHaveBeenCalledWith('/products', { replaceUrl: true });
  });

  it('navigates back safely when the backend product is missing', async () => {
    const { navigateByUrl, open } = configureTestingModule(undefined);
    const fixture = TestBed.createComponent(ProductRouteEntryComponent);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(open).not.toHaveBeenCalled();
    expect(navigateByUrl).toHaveBeenCalledWith('/products', { replaceUrl: true });
  });
});
