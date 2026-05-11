import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

import type { AdminBadgeTone } from '../models/admin-view.model';

@Component({
  selector: 'app-admin-status-badge',
  imports: [NgClass],
  template: `
    <span
      class="inline-flex min-w-16 items-center justify-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
      [ngClass]="toneClasses"
    >
      {{ label }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminStatusBadgeComponent {
  @Input({ required: true }) label = '';
  @Input() tone: AdminBadgeTone = 'neutral';

  get toneClasses(): string {
    switch (this.tone) {
      case 'success':
        return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300';
      case 'warning':
        return 'border-amber-500/25 bg-amber-500/10 text-amber-300';
      case 'danger':
        return 'border-rose-500/25 bg-rose-500/10 text-rose-300';
      case 'info':
        return 'border-sky-500/25 bg-sky-500/10 text-sky-300';
      default:
        return 'border-white/10 bg-white/5 text-zinc-300';
    }
  }
}
