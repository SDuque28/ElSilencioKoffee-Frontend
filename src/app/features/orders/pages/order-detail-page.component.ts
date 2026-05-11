import { CurrencyPipe, DatePipe } from '@angular/common';
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
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { TableComponent, type TableColumn } from '../../../shared/ui/table/table.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-order-detail-page',
  imports: [CurrencyPipe, DatePipe, RouterLink, CardComponent, ButtonComponent, TableComponent],
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

  readonly itemColumns: TableColumn[] = [
    { key: 'product', label: 'Product' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'unitPrice', label: 'Unit Price' },
    { key: 'subtotal', label: 'Subtotal' },
  ];

  readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  readonly shouldPrintOnLoad = this.route.snapshot.queryParamMap.get('print') === '1';
  loading = true;
  paying = false;
  errorMessage: string | null = null;
  order: Order | null = null;
  itemRows: Record<string, unknown>[] = [];

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
          this.itemRows = [];
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
    this.itemRows = order.items.map((item) => ({
      product: item.productName,
      quantity: item.quantity,
      unitPrice: this.formatCurrency(item.unitPrice),
      subtotal: this.formatCurrency(item.subtotal),
    }));
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private isPending(status: string | undefined): boolean {
    return status === 'PENDING' || status === 'NON PAID';
  }
}
