import { inject, Injectable } from '@angular/core';
import { delay, of, type Observable } from 'rxjs';

import type { ApiErrorResponse, ApiResponse } from '../../../core/models/api-response.model';
import type { Product } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';

const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-premium-01',
    name: 'Cafe Premium',
    price: 15000,
    stock: 50,
    description: 'Cafe organico de altura con perfil dulce y cuerpo balanceado.',
  },
  {
    id: 'prod-honey-02',
    name: 'Honey Process Reserve',
    price: 18000,
    stock: 18,
    description: 'Lote con notas de miel, panela y acidez citrica moderada.',
  },
  {
    id: 'prod-forest-03',
    name: 'Forest Blend',
    price: 16500,
    stock: 7,
    description: 'Mezcla para espresso con cacao, nuez y final persistente.',
  },
];

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly api = inject(ApiService);

  listProducts(page = 1, limit = 10): Observable<ApiResponse<Product[]>> {
    const startIndex = (page - 1) * limit;
    const products = MOCK_PRODUCTS.slice(startIndex, startIndex + limit);

    return this.api.get<Product[]>('products', {
      params: { page, limit },
      mock: {
        data: products,
        delayMs: 0,
        message: 'Mock products loaded successfully.',
      },
    });
  }

  getProduct(productId: string): Observable<ApiResponse<Product>> {
    const product = MOCK_PRODUCTS.find((item) => item.id === productId);

    if (!product) {
      const errorResponse: ApiErrorResponse = {
        success: false,
        error: 'Mock product not found.',
        code: 404,
      };

      return of(errorResponse).pipe(delay(0));
    }

    return this.api.get<Product>(`products/${productId}`, {
      mock: {
        data: product,
        delayMs: 0,
        message: 'Mock product loaded successfully.',
      },
    });
  }
}
