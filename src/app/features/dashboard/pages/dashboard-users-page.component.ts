import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { TableComponent, type TableColumn } from '../../../shared/ui/table/table.component';

@Component({
  selector: 'app-dashboard-users-page',
  imports: [CardComponent, TableComponent],
  templateUrl: './dashboard-users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUsersPageComponent {
  readonly columns: TableColumn[] = [
    { key: 'name', label: 'Buyer' },
    { key: 'orders', label: 'Orders' },
    { key: 'spend', label: 'Total Spend' },
  ];

  readonly rows: Record<string, unknown>[] = [
    { name: 'Camila Perez', orders: 24, spend: '$1,280' },
    { name: 'Daniel Torres', orders: 18, spend: '$1,010' },
    { name: 'Ana Mercado', orders: 14, spend: '$860' },
  ];
}
