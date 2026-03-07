import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ChartData } from 'chart.js';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-dashboard-sales-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './dashboard-sales-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSalesPageComponent {
  readonly chartData: ChartData<'bar'> = {
    labels: ['Espresso', 'Filter', 'Capsules', 'Accessories'],
    datasets: [
      {
        label: 'Units sold',
        data: [320, 280, 190, 95],
        backgroundColor: ['#6d3a1a', '#2f6f54', '#8a5a3a', '#d4b69b'],
      },
    ],
  };
}
