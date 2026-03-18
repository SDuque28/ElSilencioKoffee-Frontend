import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard-sales-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './dashboard-sales-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSalesPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);

  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Orders by week',
        data: [],
        backgroundColor: ['#6d3a1a', '#2f6f54', '#8a5a3a', '#d4b69b'],
      },
    ],
  };

  ngOnInit(): void {
    this.dashboardService
      .getSalesMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (!isApiSuccessResponse(response)) {
          return;
        }

        this.chartData = {
          ...this.chartData,
          labels: response.data.map((item) => item.label),
          datasets: [
            {
              ...this.chartData.datasets[0],
              data: response.data.map((item) => item.value),
            },
          ],
        };
      });
  }
}
