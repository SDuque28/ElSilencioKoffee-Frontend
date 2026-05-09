import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard-settings-page',
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-white">Settings</h1>
        <p class="mt-1 text-sm text-zinc-500">Admin capabilities currently supported by the backend.</p>
      </div>
      <div class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
        <h2 class="text-sm font-semibold text-white">Pending backend support</h2>
        <ul class="mt-3 space-y-2 text-sm text-zinc-400">
          <li>Delivery status update endpoint.</li>
          <li>Refunds, conversion rate, subscriptions, loyalty points and phone numbers.</li>
          <li>Featured product, organic certification and inventory creation fields in product create.</li>
          <li>Order archive and invoice generation.</li>
        </ul>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSettingsPageComponent {}
