import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import type { ChartConfiguration, ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AdminChartCardComponent } from '../components/admin-chart-card.component';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import type {
  AdminAnalytics,
  AdminChartSeries,
  AdminOrderRow,
  AdminStatusChartSeries,
} from '../models/admin-view.model';
import { buildAnalytics } from '../services/admin-calculations';
import { AdminDashboardReportService } from '../services/admin-dashboard-report.service';
import { AdminDataService } from '../services/admin-data.service';
import { AdminMonitoringThresholdsService } from '../services/admin-monitoring-thresholds.service';
import { buildAnalyticsPageReport } from '../services/admin-page-reports';
import { AdminProjectReportService } from '../services/admin-project-report.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-dashboard-analytics-page',
  imports: [
    FormsModule,
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
  private readonly reportService = inject(AdminDashboardReportService);
  private readonly projectReportService = inject(AdminProjectReportService);
  private readonly thresholdsService = inject(AdminMonitoringThresholdsService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

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
  exporting = false;
  generating = false;
  errorMessage: string | null = null;
  searchTerm = '';
  analytics: AdminAnalytics | null = null;
  revenueChart: ChartData<'line'> = this.toRevenueChart({ labels: [], values: [] });
  statusChart: ChartData<'bar'> = this.toStatusChart({
    labels: [],
    paid: [],
    processing: [],
    shipped: [],
    delivered: [],
  });
  salesChartTab: 'Revenue' | 'Orders' = 'Revenue';
  statusChartTab: 'Paid' | 'Processing' | 'Shipped' | 'Delivered' = 'Paid';

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.cdr.markForCheck();
    });

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
        this.analytics = buildAnalytics(response.data, {
          thresholdConfig: this.thresholdsService.config(),
        });
        this.updateCharts();
        this.cdr.markForCheck();
      });
  }

  async viewAllOrders(): Promise<void> {
    await this.router.navigateByUrl('/dashboard/orders');
  }

  get filteredRecentOrders(): AdminOrderRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    const rows = this.analytics?.recentOrders ?? [];
    if (!query) {
      return rows;
    }

    return rows.filter(
      (order) =>
        order.orderCode.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        (order.source.items?.[0]?.productName ?? '').toLowerCase().includes(query),
    );
  }

  setSalesChartTab(tab: string): void {
    this.salesChartTab = tab === 'Orders' ? 'Orders' : 'Revenue';
    this.updateCharts();
  }

  setStatusChartTab(tab: string): void {
    if (tab === 'Processing' || tab === 'Shipped' || tab === 'Delivered') {
      this.statusChartTab = tab;
    } else {
      this.statusChartTab = 'Paid';
    }
    this.updateCharts();
  }

  async exportAnalytics(): Promise<void> {
    if (!this.analytics || this.exporting) {
      return;
    }

    this.exporting = true;
    this.cdr.markForCheck();

    try {
      await this.reportService.exportReport(
        buildAnalyticsPageReport({
          analytics: this.analytics,
          searchLabel: this.searchTerm.trim() || 'All recent orders',
          chartTabLabel: this.salesChartTab,
          statusTabLabel: this.statusChartTab,
          rows: this.filteredRecentOrders,
        }),
      );
      this.toastService.show({
        title: 'Analytics report generated',
        description: 'The analytics report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Analytics export failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the analytics report.',
        variant: 'error',
      });
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
  }

  async generateReport(): Promise<void> {
    if (this.generating) {
      return;
    }

    this.generating = true;
    this.cdr.markForCheck();

    try {
      await this.projectReportService.exportCompleteProjectReport();
      this.toastService.show({
        title: 'Project report generated',
        description: 'The complete admin project report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Project report failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the project report.',
        variant: 'error',
      });
    } finally {
      this.generating = false;
      this.cdr.markForCheck();
    }
  }

  async configureThresholds(): Promise<void> {
    await this.router.navigateByUrl('/dashboard/settings');
  }

  private toRevenueChart(series: AdminChartSeries): ChartData<'line'> {
    return {
      labels: series.labels,
      datasets: [
        {
          label: this.salesChartTab === 'Orders' ? 'Total Orders' : 'Revenue',
          data: series.values,
          borderColor: this.salesChartTab === 'Orders' ? '#38bdf8' : '#f97316',
          backgroundColor:
            this.salesChartTab === 'Orders' ? 'rgba(56,189,248,0.12)' : 'rgba(249,115,22,0.18)',
          pointBackgroundColor: this.salesChartTab === 'Orders' ? '#38bdf8' : '#f97316',
          pointBorderColor: this.salesChartTab === 'Orders' ? '#bae6fd' : '#fed7aa',
          pointRadius: 4,
          fill: true,
          tension: 0.4,
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
      ].filter((dataset) => dataset.data.length > 0),
    };
  }

  private updateCharts(): void {
    if (!this.analytics) {
      return;
    }

    const primarySeries =
      this.salesChartTab === 'Orders' ? this.analytics.orderSeries : this.analytics.revenueSeries;
    this.revenueChart = this.toRevenueChart(primarySeries);

    const selectedStatusSeries = {
      labels: this.analytics.statusSeries.labels,
      paid: this.statusChartTab === 'Paid' ? this.analytics.statusSeries.paid : [],
      processing: this.statusChartTab === 'Processing' ? this.analytics.statusSeries.processing : [],
      shipped: this.statusChartTab === 'Shipped' ? this.analytics.statusSeries.shipped : [],
      delivered: this.statusChartTab === 'Delivered' ? this.analytics.statusSeries.delivered : [],
    };

    this.statusChart = this.toStatusChart(selectedStatusSeries);
  }
}
