import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ChartData } from 'chart.js';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-dashboard-home-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './dashboard-home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomePageComponent {
  readonly kpiCards = [
    { label: 'Monthly Revenue', value: '$42,180' },
    { label: 'Active Customers', value: '1,248' },
    { label: 'Completed Orders', value: '892' },
  ];

  readonly chartData: ChartData<'line'> = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Revenue (USD)',
        data: [12000, 14000, 15000, 13800, 17500, 18900],
        borderColor: '#6d3a1a',
        backgroundColor: 'rgba(109, 58, 26, 0.2)',
        fill: true,
        tension: 0.35,
      },
    ],
  };
}
