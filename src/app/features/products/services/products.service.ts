import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly api = inject(ApiService);

  listProducts(): Observable<ApiResponse<Product[]>> {
    return this.api.get<ApiResponse<Product[]>>('products');
  }

  getProduct(productId: string): Observable<ApiResponse<Product>> {
    return this.api.get<ApiResponse<Product>>(`products/${productId}`);
  }
}
