import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartConfiguration, ChartData } from 'chart.js';

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
  private readonly cdr = inject(ChangeDetectorRef);
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

  loading = true;
  errorMessage: string | null = null;
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Orders by week',
        data: [],
        backgroundColor: ['#ff7a00', '#ff922e', '#ffab5c', '#ffbf82'],
      },
    ],
  };

  ngOnInit(): void {
    this.dashboardService
      .getOrderVolumeSeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.chartData = this.createEmptyChartData();
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.chartData = {
          ...this.chartData,
          labels: response.data.labels,
          datasets: [
            {
              ...this.chartData.datasets[0],
              data: response.data.values,
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  get hasChartData(): boolean {
    return Array.isArray(this.chartData.labels) && this.chartData.labels.length > 0;
  }

  private createEmptyChartData(): ChartData<'bar'> {
    return {
      labels: [],
      datasets: [
        {
          ...this.chartData.datasets[0],
          data: [],
        },
      ],
    };
  }
}
