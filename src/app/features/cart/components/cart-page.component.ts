import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
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
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);

  readonly cartState = inject(CartStateService);

  ngOnInit(): void {
    this.cartState.loadCart().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  increaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity + 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          return;
        }

        this.toastService.show({
          title: 'Unable to update quantity',
          description: response.error,
          variant: 'error',
        });
      });
  }

  decreaseQuantity(itemId: string, currentQuantity: number): void {
    this.cartState
      .updateQuantity(itemId, currentQuantity - 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          return;
        }

        this.toastService.show({
          title: 'Unable to update quantity',
          description: response.error,
          variant: 'error',
        });
      });
  }

  checkout(): void {
    if (!this.authService.isAuthenticated()) {
      this.toastService.show({
        title: 'Sign in required',
        description: 'Create an account or sign in to continue to checkout.',
        variant: 'error',
      });
      void this.router.navigate(['/login'], {
        queryParams: { redirectTo: '/checkout' },
      });
      return;
    }

    void this.router.navigate(['/checkout']);
  }

  clearCart(): void {
    this.cartState
      .clearCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Cart cleared',
            description: 'Your cart was cleared successfully.',
            variant: 'success',
          });
          return;
        }

        this.toastService.show({
          title: 'Unable to clear cart',
          description: response.error,
          variant: 'error',
        });
      });
  }
}
