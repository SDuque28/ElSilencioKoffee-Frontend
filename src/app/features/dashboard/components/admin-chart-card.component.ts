import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import type { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-admin-chart-card',
  imports: [ChartContainerComponent],
  template: `
    <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-sm font-semibold text-white">{{ title }}</h2>
          @if (subtitle) {
            <p class="mt-1 text-xs text-zinc-500">{{ subtitle }}</p>
          }
        </div>
        @if (tabs.length > 0) {
          <div class="rounded-md border border-white/10 bg-black/30 p-0.5 text-[11px] text-zinc-400">
            @for (tab of tabs; track tab) {
              <span class="inline-flex rounded px-2 py-1 first:bg-zinc-800 first:text-white">{{ tab }}</span>
            }
          </div>
        }
      </div>

      @if (hasData) {
        <div class="h-72">
          <app-chart-container surface="dark" [type]="type" [data]="data" [options]="options" />
        </div>
      } @else {
        <div
          class="flex h-72 items-center justify-center rounded-md border border-dashed border-white/10 bg-black/20 text-sm text-zinc-500"
        >
          No data available.
        </div>
      }
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChartCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() tabs: string[] = [];
  @Input() type: ChartType = 'line';
  @Input({ required: true }) data!: ChartData;
  @Input() options: ChartConfiguration['options'] = {};

  get hasData(): boolean {
    return Array.isArray(this.data?.labels) && this.data.labels.length > 0;
  }
}
