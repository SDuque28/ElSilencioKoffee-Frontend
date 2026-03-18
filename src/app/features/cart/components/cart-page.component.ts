import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../services/cart-state.service';

@Component({
  selector: 'app-cart-page',
  imports: [CardComponent, ButtonComponent],
  templateUrl: './cart-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly cartState = inject(CartStateService);

  ngOnInit(): void {
    this.cartState.loadCart().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  increaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  decreaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity - 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  checkout(): void {
    this.cartState
      .checkout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Mock order created',
            description: `Order ${response.data.id} generated and cart cleared.`,
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to create order',
          description: response.error,
          variant: 'error',
        });
      });
  }
}
