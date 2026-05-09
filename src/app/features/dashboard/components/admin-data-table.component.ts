import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-admin-data-table',
  styleUrl: './admin-data-table.component.css',
  template: `
    <section class="overflow-hidden rounded-lg border border-white/10 bg-[#1b1b1d]">
      @if (title || actionLabel) {
        <div class="flex items-center justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            @if (title) {
              <h2 class="text-sm font-semibold text-white">{{ title }}</h2>
            }
            @if (subtitle) {
              <p class="mt-1 text-xs text-zinc-500">{{ subtitle }}</p>
            }
          </div>
          @if (actionLabel) {
            <button type="button" class="text-xs font-semibold text-[#f97316]">
              {{ actionLabel }}
            </button>
          }
        </div>
      }
      <div class="overflow-x-auto">
        <ng-content />
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDataTableComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() actionLabel = '';
}
