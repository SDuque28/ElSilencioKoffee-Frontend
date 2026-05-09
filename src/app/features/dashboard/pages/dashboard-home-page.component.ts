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
import { AdminChartCardComponent } from '../components/admin-chart-card.component';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import type { AdminChartSeries, AdminOverview } from '../models/admin-view.model';
import { buildOverview } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';

@Component({
  selector: 'app-dashboard-home-page',
  imports: [
    AdminChartCardComponent,
    AdminDataTableComponent,
    AdminMetricCardComponent,
    AdminStatusBadgeComponent,
  ],
  templateUrl: './dashboard-home-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardHomePageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        ticks: { color: '#71717a' },
        grid: { display: false },
      },
      y: {
        ticks: { color: '#71717a' },
        grid: { color: 'rgba(255,255,255,0.06)' },
      },
    },
  };

  loading = true;
  errorMessage: string | null = null;
  overview: AdminOverview | null = null;
  revenueChart: ChartData<'line'> = this.toLineChart({ labels: [], values: [] });

  ngOnInit(): void {
    this.adminData
      .getSnapshot()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.overview = null;
          this.revenueChart = this.toLineChart({ labels: [], values: [] });
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.overview = buildOverview(response.data);
        this.revenueChart = this.toLineChart(this.overview.revenueSeries);
        this.cdr.markForCheck();
      });
  }

  private toLineChart(series: AdminChartSeries): ChartData<'line'> {
    return {
      labels: series.labels,
      datasets: [
        {
          label: 'Revenue',
          data: series.values,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249, 115, 22, 0.18)',
          pointBackgroundColor: '#f97316',
          pointRadius: 2,
          fill: true,
          tension: 0.45,
        },
      ],
    };
  }
}
