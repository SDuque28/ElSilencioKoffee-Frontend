import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { PRODUCT_IMAGE_FALLBACK, type Product } from '../../../core/models/product.model';
import { ApiService } from '../../../core/services/api.service';

export interface ProductsListResponse {
  count: number;
  products: Product[];
}

interface BackendProductResponse {
  id: number;
  name: string;
  imageUrl: string | null;
  price: number;
  presentationId: number | null;
  productionId: number | null;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly api = inject(ApiService);

  listProducts(): Observable<ProductsListResponse> {
    return this.api.get<BackendProductResponse[]>('products').pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return { count: 0, products: [] };
        }

        const products = response.data.map((product, index) => this.toProduct(product, index < 4));
        return {
          count: products.length,
          products,
        };
      }),
    );
  }

  listFeaturedProducts(): Observable<Product[]> {
    return this.listProducts().pipe(map((response) => response.products.filter((product) => product.featured)));
  }

  listCollectionProducts(): Observable<Product[]> {
    return this.listProducts().pipe(
      map((response) =>
        response.products
          .filter((product) =>
            ['Equipment', 'Brewing Kit', 'Accessories'].includes(product.category ?? ''),
          )
          .slice(0, 4),
      ),
    );
  }

  getProduct(productId: string): Observable<Product | undefined> {
    return this.api.get<BackendProductResponse>(`products/${productId}`).pipe(
      map((response) => {
        if (!isApiSuccessResponse(response)) {
          return undefined;
        }

        return this.toProduct(response.data);
      }),
    );
  }

  private toProduct(product: BackendProductResponse, featured = false): Product {
    return {
      id: String(product.id),
      backendId: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.imageUrl?.trim() || PRODUCT_IMAGE_FALLBACK,
      category: this.resolveCategory(product.presentationId),
      description: null,
      stock: null,
      featured,
    };
  }

  private resolveCategory(presentationId: number | null): string {
    switch (presentationId) {
      case 4:
        return 'Capsules';
      case 5:
        return 'Equipment';
      case 6:
        return 'Brewing Kit';
      case 7:
      case 8:
      case 9:
        return 'Accessories';
      case 10:
        return 'Blend';
      default:
        return 'Coffee';
    }
  }
}
