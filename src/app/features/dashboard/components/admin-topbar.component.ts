import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Bell, Download, LucideAngularModule, Search } from 'lucide-angular';

@Component({
  selector: 'app-admin-topbar',
  imports: [LucideAngularModule],
  template: `
    <header class="sticky top-0 z-20 border-b border-white/10 bg-[#0f0f10]/95 backdrop-blur">
      <div class="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div class="relative max-w-xl flex-1">
          <lucide-icon [img]="icons.search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search orders, roast profiles, or customers..."
            class="h-9 w-full rounded-md border border-white/10 bg-white/[0.05] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#f97316]/50"
          />
        </div>
        <button type="button" class="grid h-9 w-9 place-items-center rounded-md border border-white/10 text-zinc-400 hover:text-white">
          <lucide-icon [img]="icons.bell" class="h-4 w-4" />
        </button>
        <span class="hidden rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300 sm:inline-flex">
          Roastery View
        </span>
        <button
          type="button"
          class="hidden items-center gap-2 rounded-md bg-[#f97316] px-3 py-2 text-xs font-semibold text-black hover:bg-[#fb923c] sm:inline-flex"
        >
          <lucide-icon [img]="icons.download" class="h-4 w-4" />
          Export Reports
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTopbarComponent {
  protected readonly icons = {
    bell: Bell,
    download: Download,
    search: Search,
  };
}
