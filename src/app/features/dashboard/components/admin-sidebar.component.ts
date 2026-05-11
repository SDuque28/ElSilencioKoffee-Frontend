import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  BarChart3,
  Bell,
  Box,
  Gauge,
  LogOut,
  LucideAngularModule,
  Package,
  Settings,
  ShoppingBag,
  UsersRound,
} from 'lucide-angular';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#0d0d0e] lg:flex lg:flex-col">
      <div class="flex h-16 items-center gap-3 border-b border-white/10 px-5">
        <span class="grid h-9 w-9 place-items-center rounded-md bg-[#f97316] text-black">
          <lucide-icon [img]="icons.logo" class="h-4 w-4" />
        </span>
        <div>
          <p class="text-sm font-semibold text-white">Coffee Admin</p>
          <p class="text-[11px] text-zinc-500">Silencio Koffee</p>
        </div>
      </div>

      <nav class="flex-1 space-y-1 px-3 py-4 text-sm">
        @for (item of menu; track item.path) {
          <a
            [routerLink]="item.path"
            routerLinkActive="border-[#f97316]/30 bg-[#4b220b] text-[#f97316]"
            [routerLinkActiveOptions]="{ exact: item.exact }"
            class="flex items-center gap-3 rounded-md border border-transparent px-3 py-2.5 text-zinc-400 transition hover:bg-white/5 hover:text-white"
          >
            <lucide-icon [img]="item.icon" class="h-4 w-4" />
            {{ item.label }}
          </a>
        }
      </nav>

      <div class="border-t border-white/10 p-4">
        <a
          routerLink="/dashboard/settings"
          routerLinkActive="bg-white/5 text-white"
          class="mb-3 flex items-center gap-3 rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-white/5 hover:text-white"
        >
          <lucide-icon [img]="icons.settings" class="h-4 w-4" />
          Settings
        </a>
        <button
          type="button"
          class="flex w-full items-center gap-3 rounded-lg bg-white/[0.03] p-3 text-left transition hover:bg-[#4b220b]/70"
          title="Logout"
          (click)="logout()"
        >
          <span class="grid h-9 w-9 place-items-center rounded-full bg-[#f97316] text-xs font-semibold text-black">
            {{ initials }}
          </span>
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-white">{{ username }}</p>
            <p class="text-[11px] text-zinc-500">Admin Account - Logout</p>
          </div>
          <lucide-icon [img]="icons.logout" class="ml-auto h-4 w-4 text-zinc-500" />
        </button>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSidebarComponent {
  private readonly auth = inject(AuthService);

  protected readonly icons = {
    logo: Box,
    settings: Settings,
    bell: Bell,
    logout: LogOut,
  };

  protected readonly menu = [
    { label: 'Dashboard', path: '/dashboard', icon: Gauge, exact: true },
    { label: 'Products', path: '/dashboard/products', icon: Package, exact: true },
    { label: 'Orders', path: '/dashboard/orders', icon: ShoppingBag, exact: true },
    { label: 'Users', path: '/dashboard/users', icon: UsersRound, exact: true },
    { label: 'Analytics', path: '/dashboard/analytics', icon: BarChart3, exact: true },
    { label: 'Monitoring', path: '/dashboard/monitoring', icon: Bell, exact: true },
  ];

  get username(): string {
    return this.auth.currentUser()?.username ?? 'Admin';
  }

  get initials(): string {
    return this.username.slice(0, 2).toUpperCase();
  }

  logout(): void {
    this.auth.logout();
  }
}
