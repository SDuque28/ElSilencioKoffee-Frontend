import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { type ApiResponse } from 'app/core/models/api-response.model';
import { PRODUCT_IMAGE_FALLBACK } from 'app/core/models/product.model';
import { ApiService } from 'app/core/services/api.service';
import { ProductsService } from 'app/features/products/services/products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let apiService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiService = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        ProductsService,
        {
          provide: ApiService,
          useValue: apiService,
        },
      ],
    });

    service = TestBed.inject(ProductsService);
  });

  it('loads products from the backend endpoint and maps them to the UI model', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: [
          {
            id: 5,
            name: 'Barista Pro Grinder',
            imageUrl: null,
            price: 189,
            presentationId: 5,
            productionId: 4,
            stockQuantity: 3,
          },
        ],
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const result = await firstValueFrom(service.listProducts());

    expect(apiService.get).toHaveBeenCalledWith('products');
    expect(result.count).toBe(1);
    expect(result.products).toEqual([
      {
        id: '5',
        backendId: 5,
        name: 'Barista Pro Grinder',
        price: 189,
        image: PRODUCT_IMAGE_FALLBACK,
        category: 'Equipment',
        description: null,
        stock: 3,
        availability: 'LOW_STOCK',
        featured: true,
      },
    ]);
  });

  it('loads a single product from the backend endpoint', async () => {
    apiService.get.mockReturnValue(
      of({
        success: true,
        data: {
          id: 1,
          name: 'Ethiopian Yirgacheffe',
          imageUrl: 'https://example.com/yirgacheffe.jpg',
          price: 26,
          presentationId: 1,
          productionId: 1,
          stockQuantity: 20,
        },
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const result = await firstValueFrom(service.getProduct('1'));

    expect(apiService.get).toHaveBeenCalledWith('products/1');
    expect(result?.id).toBe('1');
    expect(result?.category).toBe('Coffee');
    expect(result?.image).toBe('https://example.com/yirgacheffe.jpg');
    expect(result?.stock).toBe(20);
    expect(result?.availability).toBe('IN_STOCK');
  });

  it('returns undefined when the backend responds with an error for a missing product', async () => {
    apiService.get.mockReturnValue(
      of({
        success: false,
        error: 'Product not found',
        code: 404,
      } satisfies ApiResponse<unknown>),
    );

    const result = await firstValueFrom(service.getProduct('404'));

    expect(result).toBeUndefined();
  });
});
