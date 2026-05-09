import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { AdminMetric } from '../models/admin-view.model';
import { AdminStatusBadgeComponent } from './admin-status-badge.component';

@Component({
  selector: 'app-admin-metric-card',
  imports: [AdminStatusBadgeComponent],
  template: `
    <article class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.24)]">
      <div class="flex items-start justify-between gap-3">
        <p class="text-[11px] font-medium uppercase text-zinc-500">{{ metric.label }}</p>
        @if (metric.change) {
          <app-admin-status-badge [label]="metric.change" [tone]="metric.tone ?? 'neutral'" />
        }
      </div>
      <p class="mt-4 text-2xl font-semibold text-white">{{ metric.value }}</p>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMetricCardComponent {
  @Input({ required: true }) metric!: AdminMetric;
}
