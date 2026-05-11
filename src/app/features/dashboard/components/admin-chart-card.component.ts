import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import type { ChartConfiguration, ChartData, ChartType } from 'chart.js';

import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-admin-chart-card',
  imports: [ChartContainerComponent],
  template: `
    <section class="min-w-0 rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
      <div class="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 class="text-sm font-semibold text-white">{{ title }}</h2>
          @if (subtitle) {
            <p class="mt-1 text-xs text-zinc-500">{{ subtitle }}</p>
          }
        </div>
        @if (tabs.length > 0) {
          <div class="rounded-md border border-white/10 bg-black/30 p-0.5 text-[11px] text-zinc-400">
            @for (tab of tabs; track tab) {
              <button
                type="button"
                class="inline-flex rounded px-2 py-1 transition-colors"
                [class.bg-zinc-800]="tab === resolvedActiveTab"
                [class.text-white]="tab === resolvedActiveTab"
                [class.hover:text-white]="tab !== resolvedActiveTab"
                (click)="selectTab(tab)"
              >
                {{ tab }}
              </button>
            }
          </div>
        }
      </div>

      @if (hasData) {
        <div class="min-w-0 h-[clamp(16rem,34vw,22rem)]">
          <app-chart-container
            surface="dark"
            [type]="type"
            [data]="data"
            [options]="options"
            [dataCy]="dataCy"
          />
        </div>
      } @else {
        <div
          class="flex h-[clamp(16rem,34vw,22rem)] items-center justify-center rounded-md border border-dashed border-white/10 bg-black/20 text-sm text-zinc-500"
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
  @Input() dataCy: string | null = null;
  @Input() activeTab: string | null = null;
  @Output() readonly activeTabChange = new EventEmitter<string>();

  get hasData(): boolean {
    return Array.isArray(this.data?.labels) && this.data.labels.length > 0;
  }

  get resolvedActiveTab(): string {
    return this.activeTab ?? this.tabs[0] ?? '';
  }

  selectTab(tab: string): void {
    if (tab === this.resolvedActiveTab) {
      return;
    }

    this.activeTabChange.emit(tab);
  }
}
