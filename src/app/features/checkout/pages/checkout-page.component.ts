import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import type { CheckoutRequest } from '../../../core/models/checkout.model';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { CartStateService } from '../../cart/services/cart-state.service';
import { OrdersService } from '../../orders/services/orders.service';

@Component({
  selector: 'app-checkout-page',
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    ButtonComponent,
    FormFieldComponent,
  ],
  templateUrl: './checkout-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckoutPageComponent implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly toastService = inject(ToastService);

  readonly cartState = inject(CartStateService);

  loadingCart = true;
  submitting = false;
  serverError: string | null = null;

  readonly form = this.formBuilder.nonNullable.group({
    address: ['', [Validators.required, Validators.maxLength(255)]],
    country: ['', [Validators.required, Validators.maxLength(100)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    neighborhood: ['', [Validators.required, Validators.maxLength(100)]],
    referenceDetails: ['', [Validators.maxLength(255)]],
    paymentMethod: ['CREDIT_CARD' as const, [Validators.required]],
    cardholderName: ['', [Validators.required, Validators.maxLength(120)]],
    cardNumber: ['', [Validators.required, Validators.pattern(/^[\d\s]{13,23}$/)]],
    expirationDate: ['', [Validators.required, Validators.pattern(/^\d{2}\/(\d{2}|\d{4})$/)]],
    cvv: ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    notes: ['', [Validators.maxLength(500)]],
  });

  readonly controlClasses =
    'h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  ngOnInit(): void {
    this.loadingCart = true;
    this.cartState
      .loadCart()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loadingCart = false;

        if (!isApiSuccessResponse(response)) {
          this.serverError = response.error;
        } else {
          this.serverError = null;
        }

        this.cdr.markForCheck();
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.cartState.items().length === 0) {
      this.serverError = 'Your cart is empty.';
      this.cdr.markForCheck();
      return;
    }

    this.submitting = true;
    this.serverError = null;

    this.ordersService
      .checkout(this.toCheckoutRequest())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.submitting = false;

        if (!isApiSuccessResponse(response)) {
          this.serverError = response.error;
          this.toastService.show({
            title: 'Unable to complete checkout',
            description: response.error,
            variant: 'error',
          });
          this.cdr.markForCheck();
          return;
        }

        this.cartState.restoreCartState();
        this.toastService.show({
          title: 'Purchase confirmed',
          description: `Order ${response.data.orderId} was paid successfully and is already out for shipment.`,
          variant: 'success',
        });
        void this.router.navigate(['/orders', response.data.orderId]);
      });
  }

  private toCheckoutRequest(): CheckoutRequest {
    const raw = this.form.getRawValue();
    return {
      shippingInformation: {
        address: raw.address,
        country: raw.country,
        city: raw.city,
        neighborhood: raw.neighborhood,
        referenceDetails: raw.referenceDetails || null,
      },
      payment: {
        paymentMethod: raw.paymentMethod,
        cardholderName: raw.cardholderName,
        cardNumber: raw.cardNumber,
        expirationDate: raw.expirationDate,
        cvv: raw.cvv,
      },
      notes: raw.notes || null,
    };
  }
}
