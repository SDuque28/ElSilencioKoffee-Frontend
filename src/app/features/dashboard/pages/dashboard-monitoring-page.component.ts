import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import type { AdminMonitoringMetric } from '../models/admin-view.model';
import { buildMonitoring } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';

@Component({
  selector: 'app-dashboard-monitoring-page',
  imports: [AdminStatusBadgeComponent],
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-white">Monitoring</h1>
        <p class="mt-1 text-sm text-zinc-500">Environmental metrics from /environment-metrics.</p>
      </div>

      @if (loading) {
        <div class="rounded-lg border border-white/10 bg-[#1b1b1d] p-6 text-sm text-zinc-400">
          Loading monitoring data...
        </div>
      } @else if (errorMessage) {
        <div class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-6 text-sm text-rose-200">
          {{ errorMessage }}
        </div>
      } @else {
        <div class="grid gap-4 md:grid-cols-3">
          @for (metric of metrics; track metric.label) {
            <article class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
              <p class="text-[11px] uppercase text-zinc-500">{{ metric.label }}</p>
              <div class="mt-4 flex items-center justify-between gap-4">
                <p class="text-2xl font-semibold text-white">{{ metric.value }}</p>
                <app-admin-status-badge [label]="metric.status" [tone]="metric.tone" />
              </div>
            </article>
          }
        </div>

        <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
          <h2 class="text-sm font-semibold text-white">Alert Thresholds</h2>
          <p class="mt-2 text-sm text-zinc-500">
            Configuration is pending backend support. The cards above use the latest stored values.
          </p>
        </section>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardMonitoringPageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage: string | null = null;
  metrics: AdminMonitoringMetric[] = [];

  ngOnInit(): void {
    this.adminData
      .listEnvironmentMetrics()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;
        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.metrics = [];
          this.cdr.markForCheck();
          return;
        }
        this.errorMessage = null;
        this.metrics = buildMonitoring(response.data);
        this.cdr.markForCheck();
      });
  }
}
