import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Order } from '../../../core/models/order.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { OrdersService } from '../services/orders.service';
import {
  formatOrderCode,
  formatOrderCurrency,
  formatOrderDate,
  getDeliveryStatusPresentation,
  getDeliveryUpdateSummary,
  getOrderItemsSummary,
  getPaymentMethodSummary,
  getPaymentStatusPresentation,
  getPrimaryOrderStatusPresentation,
  getShippingDestination,
  type OrderBadgePresentation,
  toTitleCase,
} from '../utils/order-presentation';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [RouterLink, CardComponent, ButtonComponent, BadgeComponent],
  templateUrl: './order-detail-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly ordersService = inject(OrdersService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly shouldPrintOnLoad = this.route.snapshot.queryParamMap.get('print') === '1';
  loading = true;
  paying = false;
  errorMessage: string | null = null;
  order: Order | null = null;

  ngOnInit(): void {
    this.loadOrder();
  }

  get canPay(): boolean {
    return !this.authService.isAdmin() && this.isPending(this.order?.status);
  }

  payOrder(): void {
    if (!this.order || !this.canPay || this.paying) {
      return;
    }

    this.paying = true;

    this.ordersService
      .payOrder(this.order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.paying = false;

        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Unable to process payment',
            description: response.error,
            variant: 'error',
          });
          this.cdr.markForCheck();
          return;
        }

        this.setOrder(response.data);
        this.toastService.show({
          title: 'Order paid',
          description: `Order ${response.data.id} is now marked as PAID.`,
          variant: 'success',
        });
        this.cdr.markForCheck();
      });
  }

  private loadOrder(): void {
    this.loading = true;
    this.errorMessage = null;

    this.ordersService
      .getOrder(this.orderId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.order = null;
          this.errorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }

        this.setOrder(response.data);
        this.errorMessage = null;
        if (this.shouldPrintOnLoad) {
          setTimeout(() => window.print(), 250);
        }
        this.cdr.markForCheck();
      });
  }

  private setOrder(order: Order): void {
    this.order = order;
  }

  protected formatOrderCode(value: string | number): string {
    return formatOrderCode(value);
  }

  protected formatOrderDate(value: string, style: 'compact' | 'detailed' = 'compact'): string {
    return formatOrderDate(value, style);
  }

  protected formatOrderCurrency(value: number): string {
    return formatOrderCurrency(value);
  }

  protected primaryStatus(order: Order): OrderBadgePresentation {
    return getPrimaryOrderStatusPresentation(order);
  }

  protected paymentStatus(order: Order): OrderBadgePresentation {
    return getPaymentStatusPresentation(order);
  }

  protected deliveryStatus(order: Order): OrderBadgePresentation {
    return getDeliveryStatusPresentation(order);
  }

  protected itemsSummary(order: Order): string {
    return getOrderItemsSummary(order.items);
  }

  protected shippingDestination(order: Order): string | null {
    return getShippingDestination(order);
  }

  protected paymentMethodSummary(order: Order): string | null {
    return getPaymentMethodSummary(order.payment);
  }

  protected deliveryUpdateSummary(order: Order): string | null {
    return getDeliveryUpdateSummary(order.deliveryOrder);
  }

  protected formatPaymentMethod(value: string): string {
    return toTitleCase(value);
  }

  protected formatPaymentStatus(value: string): string {
    return toTitleCase(value);
  }

  private isPending(status: string | undefined): boolean {
    return status === 'PENDING' || status === 'NON PAID';
  }
}
