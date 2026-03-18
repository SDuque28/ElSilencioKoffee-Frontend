import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartConfiguration, ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { DashboardMetric } from '../../../core/models/dashboard.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';
import { DashboardService } from '../services/dashboard.service';

@Component({
  selector: 'app-dashboard-home-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './dashboard-home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomePageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(DashboardService);

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e5e5',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },
    },
  };

  kpiCards: DashboardMetric[] = [];
  chartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Revenue (Orders)',
        data: [],
        borderColor: '#ff7a00',
        backgroundColor: 'rgba(255, 122, 0, 0.22)',
        fill: true,
        tension: 0.35,
      },
    ],
  };

  ngOnInit(): void {
    this.dashboardService
      .getMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.kpiCards = isApiSuccessResponse(response) ? response.data : [];
      });

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
