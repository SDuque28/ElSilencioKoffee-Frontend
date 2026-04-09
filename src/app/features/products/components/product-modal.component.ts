import { CurrencyPipe, DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  effect,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideAngularModule, ShoppingCart, X } from 'lucide-angular';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { PRODUCT_IMAGE_FALLBACK, type Product } from '../../../core/models/product.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { ProductModalService } from '../services/product-modal.service';

@Component({
  selector: 'app-product-modal',
  imports: [CurrencyPipe, LucideAngularModule, BadgeComponent, ButtonComponent],
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly toastService = inject(ToastService);

  readonly cartState = inject(CartStateService);
  readonly modalState = inject(ProductModalService);

  protected readonly icons = {
    close: X,
    cart: ShoppingCart,
  };
  protected readonly fallbackImage = PRODUCT_IMAGE_FALLBACK;

  constructor() {
    effect(() => {
      const shouldLockScroll = this.modalState.isOpen() || this.cartState.isDrawerOpen();
      this.document.body.style.overflow = shouldLockScroll ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.style.overflow = '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.modalState.isOpen()) {
      this.close();
    }
  }

  close(): void {
    this.modalState.close();
  }

  addToCart(product: Product): void {
    this.modalState.close();

    this.cartState
      .addItem(product)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Added to cart',
            description: `${product.name} was added to your selection.`,
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to add item',
          description: response.error,
          variant: 'error',
        });
      });
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    if (image.src === PRODUCT_IMAGE_FALLBACK) {
      return;
    }

    image.src = PRODUCT_IMAGE_FALLBACK;
  }
}
