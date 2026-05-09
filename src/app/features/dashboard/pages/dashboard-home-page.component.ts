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
import { ToastService } from '../../../shared/ui/toast/toast.service';
import type { AdminSnapshotApi } from '../models/admin-api.model';
import { AdminChartCardComponent } from '../components/admin-chart-card.component';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import type {
  AdminChartSeries,
  AdminDashboardDateFilterKey,
  AdminOverview,
} from '../models/admin-view.model';
import { buildOverview } from '../services/admin-calculations';
import { buildFilteredAdminSnapshot } from '../services/admin-dashboard-filtering';
import { AdminDataService } from '../services/admin-data.service';
import { AdminProjectReportService } from '../services/admin-project-report.service';

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
  private readonly reportService = inject(AdminProjectReportService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private snapshot: AdminSnapshotApi | null = null;

  readonly filterButtonClass =
    'rounded-md px-3 py-2 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/40';
  readonly inactiveFilterButtonClass =
    'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:bg-white/10';
  readonly activeFilterButtonClass = 'border border-[#f97316] bg-[#f97316] font-semibold text-black';

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
  exporting = false;
  errorMessage: string | null = null;
  activeFilterKey: AdminDashboardDateFilterKey = 'all-time';
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
          this.snapshot = null;
          this.overview = null;
          this.revenueChart = this.toLineChart({ labels: [], values: [] });
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.snapshot = response.data;
        this.applyOverviewFilter();
        this.cdr.markForCheck();
      });
  }

  get isLast7DaysFilterActive(): boolean {
    return this.activeFilterKey === 'last-7-days';
  }

  toggleLast7DaysFilter(): void {
    this.activeFilterKey = this.isLast7DaysFilterActive ? 'all-time' : 'last-7-days';
    this.applyOverviewFilter();
    this.cdr.markForCheck();
  }

  async exportResults(): Promise<void> {
    if (!this.overview || this.exporting) {
      return;
    }

    this.exporting = true;
    this.cdr.markForCheck();

    try {
      await this.reportService.exportCompleteProjectReport({
        activeFilter: this.overview.activeFilter,
      });
      this.toastService.show({
        title: 'Report generated',
        description: 'The complete admin project report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Report export failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the report.',
        variant: 'error',
      });
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
  }

  async viewAllOrders(): Promise<void> {
    await this.router.navigateByUrl('/dashboard/orders');
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

  private applyOverviewFilter(): void {
    if (!this.snapshot) {
      this.overview = null;
      this.revenueChart = this.toLineChart({ labels: [], values: [] });
      return;
    }

    const filteredSnapshot = buildFilteredAdminSnapshot(this.snapshot, this.activeFilterKey);
    this.overview = buildOverview(filteredSnapshot.snapshot, {
      filter: filteredSnapshot.filter,
      notes: filteredSnapshot.notes,
    });
    this.revenueChart = this.toLineChart(this.overview.revenueSeries);
  }
}
