import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import type { AdminOrderRow, AdminUserRow } from '../models/admin-view.model';
import { AdminStatusBadgeComponent } from './admin-status-badge.component';

@Component({
  selector: 'app-user-detail-panel',
  imports: [AdminStatusBadgeComponent],
  template: `
    @if (user) {
      <section class="rounded-lg border border-white/10 bg-[#151516] p-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-center gap-4">
            <span class="grid h-14 w-14 place-items-center rounded-full bg-orange-100 text-lg font-semibold text-[#7c2d12]">
              {{ user.name.slice(0, 2).toUpperCase() }}
            </span>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-semibold text-white">{{ user.name }}</h2>
                <app-admin-status-badge [label]="user.role" tone="warning" />
              </div>
              <p class="mt-1 text-sm text-zinc-500">{{ user.email }}</p>
            </div>
          </div>
          <app-admin-status-badge [label]="user.statusLabel" [tone]="user.statusTone" />
        </div>

        <div class="mt-5 grid gap-3 md:grid-cols-4">
          <div class="rounded-lg border border-white/10 bg-black/20 p-4">
            <p class="text-[11px] uppercase text-zinc-500">Total Orders</p>
            <p class="mt-2 text-xl font-semibold text-white">{{ user.totalOrders }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-black/20 p-4">
            <p class="text-[11px] uppercase text-zinc-500">Total Spent</p>
            <p class="mt-2 text-xl font-semibold text-white">{{ user.totalSpent }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-black/20 p-4">
            <p class="text-[11px] uppercase text-zinc-500">Average Order Value</p>
            <p class="mt-2 text-xl font-semibold text-white">{{ user.averageOrderValue }}</p>
          </div>
          <div class="rounded-lg border border-white/10 bg-black/20 p-4">
            <p class="text-[11px] uppercase text-zinc-500">Loyalty Points</p>
            <p class="mt-2 text-xl font-semibold text-white">N/A</p>
          </div>
        </div>

        <div class="mt-6">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-white">Order History</h3>
            <span class="text-xs text-[#f97316]">View all orders</span>
          </div>
          <div class="overflow-x-auto rounded-lg border border-white/10">
            <table class="min-w-full text-left text-sm">
              <thead class="bg-white/[0.03] text-[11px] uppercase text-zinc-500">
                <tr>
                  <th class="px-4 py-3">Order ID</th>
                  <th class="px-4 py-3">Date</th>
                  <th class="px-4 py-3">Total</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (order of orders; track order.id) {
                  <tr>
                    <td class="px-4 py-3 font-semibold text-[#f97316]">{{ order.orderCode }}</td>
                    <td class="px-4 py-3 text-zinc-400">{{ order.date }}</td>
                    <td class="px-4 py-3 text-white">{{ order.total }}</td>
                    <td class="px-4 py-3">
                      <app-admin-status-badge [label]="order.statusLabel" [tone]="order.statusTone" />
                    </td>
                    <td class="px-4 py-3 text-zinc-500">...</td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="px-4 py-8 text-center text-zinc-500">No orders for this user.</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPanelComponent {
  @Input() user: AdminUserRow | null = null;
  @Input() orders: AdminOrderRow[] = [];
}
