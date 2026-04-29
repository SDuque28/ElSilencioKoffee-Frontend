import { inject, Injectable, signal } from '@angular/core';

import type { Product } from '../../../core/models/product.model';
import { CartStateService } from '../../cart/services/cart-state.service';

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  private readonly cartState = inject(CartStateService);
  private readonly _product = signal<Product | null>(null);
  private readonly _isOpen = signal(false);

  readonly product = this._product.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();

  open(product: Product): void {
    this.cartState.closeDrawer();
    this._product.set(product);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
    this._product.set(null);
  }
}
