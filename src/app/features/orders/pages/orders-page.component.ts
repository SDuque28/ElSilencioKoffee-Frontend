import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Order } from '../../../core/models/order.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { TableComponent, type TableColumn } from '../../../shared/ui/table/table.component';
import { OrdersService } from '../services/orders.service';

@Component({
  selector: 'app-orders-page',
  imports: [CardComponent, TableComponent],
  templateUrl: './orders-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(OrdersService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  readonly columns: TableColumn[] = [
    { key: 'id', label: 'Order ID' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ];

  rows: Record<string, unknown>[] = [];

  ngOnInit(): void {
    this.ordersService
      .listOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.rows = isApiSuccessResponse(response)
          ? response.data.map((order) => this.toRow(order))
          : [];
      });
  }

  private toRow(order: Order): Record<string, unknown> {
    return {
      id: order.id,
      date: order.createdAt.slice(0, 10),
      total: this.currencyFormatter.format(order.total),
      status: order.status,
    };
  }
}
