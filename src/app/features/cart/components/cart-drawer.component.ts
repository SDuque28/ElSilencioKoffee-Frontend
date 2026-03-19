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
import { LucideAngularModule, Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-angular';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../services/cart-state.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [CurrencyPipe, ButtonComponent, LucideAngularModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawerComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly toastService = inject(ToastService);

  readonly cartState = inject(CartStateService);

  protected readonly icons = {
    close: X,
    minus: Minus,
    plus: Plus,
    remove: Trash2,
    bag: ShoppingBag,
  };

  constructor() {
    this.cartState.loadCart().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    effect(() => {
      this.document.body.style.overflow = this.cartState.isDrawerOpen() ? 'hidden' : '';
    });

    this.destroyRef.onDestroy(() => {
      this.document.body.style.overflow = '';
    });
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.cartState.isDrawerOpen()) {
      this.close();
    }
  }

  close(): void {
    this.cartState.closeDrawer();
  }

  decreaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity - 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  increaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  removeItem(itemId: string): void {
    this.cartState.removeItem(itemId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  checkout(): void {
    if (this.cartState.items().length === 0) {
      return;
    }

    this.cartState
      .checkout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Checkout complete',
            description: `Order ${response.data.id} generated from your selection.`,
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to continue',
          description: response.error,
          variant: 'error',
        });
      });
  }
}
