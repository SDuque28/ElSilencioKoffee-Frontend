import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import type { ChartConfiguration, ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AdminChartCardComponent } from '../components/admin-chart-card.component';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import type { AdminAnalytics, AdminChartSeries, AdminStatusChartSeries } from '../models/admin-view.model';
import { buildAnalytics } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';

@Component({
  selector: 'app-dashboard-analytics-page',
  imports: [
    AdminChartCardComponent,
    AdminDataTableComponent,
    AdminMetricCardComponent,
    AdminStatusBadgeComponent,
  ],
  templateUrl: './dashboard-analytics-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAnalyticsPageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  readonly revenueChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#d4d4d8' } },
      tooltip: {
        backgroundColor: '#111112',
        borderColor: 'rgba(249,115,22,0.35)',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false } },
      y: { ticks: { color: '#71717a' }, grid: { color: 'rgba(255,255,255,0.06)' } },
      y1: {
        position: 'right',
        beginAtZero: true,
        ticks: { color: '#38bdf8', precision: 0 },
        grid: { drawOnChartArea: false },
      },
    },
  };
  readonly statusChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#d4d4d8' } },
      tooltip: {
        backgroundColor: '#111112',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: '#71717a' }, grid: { display: false } },
      y: { beginAtZero: true, ticks: { color: '#71717a', precision: 0 }, grid: { color: 'rgba(255,255,255,0.06)' } },
    },
  };

  loading = true;
  errorMessage: string | null = null;
  analytics: AdminAnalytics | null = null;
  revenueChart: ChartData<'line'> = this.toRevenueChart({ labels: [], values: [] });
  statusChart: ChartData<'bar'> = this.toStatusChart({
    labels: [],
    paid: [],
    processing: [],
    shipped: [],
    delivered: [],
  });

  ngOnInit(): void {
    this.adminData
      .getSnapshot()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.analytics = null;
          this.revenueChart = this.toRevenueChart({ labels: [], values: [] });
          this.statusChart = this.toStatusChart({
            labels: [],
            paid: [],
            processing: [],
            shipped: [],
            delivered: [],
          });
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.analytics = buildAnalytics(response.data);
        this.revenueChart = this.toRevenueChart(this.analytics.revenueSeries);
        this.statusChart = this.toStatusChart(this.analytics.statusSeries);
        this.cdr.markForCheck();
      });
  }

  async viewAllOrders(): Promise<void> {
    await this.router.navigateByUrl('/dashboard/orders');
  }

  private toRevenueChart(series: AdminChartSeries): ChartData<'line'> {
    return {
      labels: series.labels,
      datasets: [
        {
          label: 'Revenue',
          data: series.values,
          borderColor: '#f97316',
          backgroundColor: 'rgba(249,115,22,0.18)',
          pointBackgroundColor: '#f97316',
          pointBorderColor: '#fed7aa',
          pointRadius: 4,
          fill: true,
          tension: 0.4,
        },
        {
          label: 'Total Orders',
          data: series.values.map((_, index) => this.analytics?.orderSeries.values[index] ?? 0),
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56,189,248,0.12)',
          pointRadius: 3,
          tension: 0.35,
          yAxisID: 'y1',
        },
      ],
    };
  }

  private toStatusChart(series: AdminStatusChartSeries): ChartData<'bar'> {
    return {
      labels: series.labels,
      datasets: [
        {
          label: 'Paid',
          data: series.paid,
          backgroundColor: '#22c55e',
          borderRadius: 4,
        },
        {
          label: 'Processing',
          data: series.processing,
          backgroundColor: '#f59e0b',
          borderRadius: 4,
        },
        {
          label: 'Shipped',
          data: series.shipped,
          backgroundColor: '#38bdf8',
          borderRadius: 4,
        },
        {
          label: 'Delivered',
          data: series.delivered,
          backgroundColor: '#14b8a6',
          borderRadius: 4,
        },
      ],
    };
  }
}
