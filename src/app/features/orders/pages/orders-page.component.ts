import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { TableComponent, type TableColumn } from '../../../shared/ui/table/table.component';

@Component({
  selector: 'app-orders-page',
  imports: [CardComponent, TableComponent],
  templateUrl: './orders-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent {
  readonly columns: TableColumn[] = [
    { key: 'id', label: 'Order ID' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ];

  readonly rows: Record<string, unknown>[] = [
    { id: 'ORD-1001', date: '2026-03-01', total: '$52.30', status: 'COMPLETED' },
    { id: 'ORD-1002', date: '2026-03-04', total: '$31.70', status: 'PENDING' },
  ];
}
