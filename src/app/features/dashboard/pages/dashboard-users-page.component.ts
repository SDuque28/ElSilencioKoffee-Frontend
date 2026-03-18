import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { TableComponent, type TableColumn } from '../../../shared/ui/table/table.component';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard-users-page',
  imports: [CardComponent, TableComponent],
  templateUrl: './dashboard-users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUsersPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);
  private readonly currencyFormatter = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });

  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Buyer' },
    { key: 'orders', label: 'Orders' },
    { key: 'spend', label: 'Total Spend' },
  ];

  rows: Record<string, unknown>[] = [];

  ngOnInit(): void {
    this.dashboardService
      .getTopBuyers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.rows = isApiSuccessResponse(response)
          ? response.data.map((buyer) => ({
              name: buyer.name,
              orders: buyer.purchases,
              spend: this.currencyFormatter.format(buyer.totalSpend),
            }))
          : [];
      });
  }
}
