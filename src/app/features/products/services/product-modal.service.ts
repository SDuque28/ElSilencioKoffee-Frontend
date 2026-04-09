import { inject, Injectable, signal } from '@angular/core';

import type { Product } from '../../../core/models/product.model';
import { CartStateService } from '../../cart/services/cart-state.service';

const MODAL_CLOSE_DELAY_MS = 220;

@Injectable({
  providedIn: 'root',
})
export class ProductModalService {
  private readonly cartState = inject(CartStateService);
  private readonly _product = signal<Product | null>(null);
  private readonly _isOpen = signal(false);

  private closeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly product = this._product.asReadonly();
  readonly isOpen = this._isOpen.asReadonly();

  open(product: Product): void {
    if (this.closeTimeoutId) {
      clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }

    this.cartState.closeDrawer();
    this._product.set(product);
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);

    if (this.closeTimeoutId) {
      clearTimeout(this.closeTimeoutId);
    }

    this.closeTimeoutId = setTimeout(() => {
      if (!this._isOpen()) {
        this._product.set(null);
      }

      this.closeTimeoutId = null;
    }, MODAL_CLOSE_DELAY_MS);
  }
}
