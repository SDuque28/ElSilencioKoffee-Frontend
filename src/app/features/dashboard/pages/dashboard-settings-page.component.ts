import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import type { AdminMonitoringThresholdConfig } from '../models/admin-view.model';
import { AdminMonitoringThresholdsService } from '../services/admin-monitoring-thresholds.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-dashboard-settings-page',
  imports: [FormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-white">Settings</h1>
        <p class="mt-1 text-sm text-zinc-500">Configure admin-side monitoring thresholds and review current backend constraints.</p>
      </div>

      <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-sm font-semibold text-white">Monitoring Thresholds</h2>
            <p class="mt-1 text-sm text-zinc-500">
              These thresholds are stored locally for the admin dashboard and drive the monitoring badge states.
            </p>
          </div>
          <button
            type="button"
            class="rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300 hover:bg-white/[0.04]"
            (click)="resetThresholds()"
          >
            Reset Defaults
          </button>
        </div>

        <form class="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5" (ngSubmit)="saveThresholds()">
          <label class="block text-xs text-zinc-400">
            Temperature Min
            <input
              [(ngModel)]="form.temperatureMin"
              name="temperatureMin"
              type="number"
              step="0.1"
              class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101011] px-3 text-sm text-white"
            />
          </label>

          <label class="block text-xs text-zinc-400">
            Temperature Max
            <input
              [(ngModel)]="form.temperatureMax"
              name="temperatureMax"
              type="number"
              step="0.1"
              class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101011] px-3 text-sm text-white"
            />
          </label>

          <label class="block text-xs text-zinc-400">
            Humidity Min
            <input
              [(ngModel)]="form.humidityMin"
              name="humidityMin"
              type="number"
              step="0.1"
              class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101011] px-3 text-sm text-white"
            />
          </label>

          <label class="block text-xs text-zinc-400">
            Humidity Max
            <input
              [(ngModel)]="form.humidityMax"
              name="humidityMax"
              type="number"
              step="0.1"
              class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101011] px-3 text-sm text-white"
            />
          </label>

          <label class="block text-xs text-zinc-400">
            CO2 Max
            <input
              [(ngModel)]="form.co2Max"
              name="co2Max"
              type="number"
              step="1"
              class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#101011] px-3 text-sm text-white"
            />
          </label>

          <div class="md:col-span-2 xl:col-span-5 flex justify-end">
            <button
              type="submit"
              class="rounded-md bg-[#f97316] px-4 py-2 text-sm font-semibold text-black"
            >
              Save Thresholds
            </button>
          </div>
        </form>
      </section>

      <div class="rounded-lg border border-white/10 bg-[#1b1b1d] p-5">
        <h2 class="text-sm font-semibold text-white">Confirmed Backend Limitations</h2>
        <ul class="mt-3 space-y-2 text-sm text-zinc-400">
          <li>Manual admin order creation is not supported by the current orders API.</li>
          <li>Refunds, conversion rate, subscriptions, loyalty points, and phone numbers are not exposed by the backend.</li>
          <li>Featured product, organic certification, and inventory creation fields are not part of the product create/update contract.</li>
          <li>Order archive workflows are not exposed; invoice access uses the printable order detail page instead.</li>
        </ul>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSettingsPageComponent {
  private readonly thresholdsService = inject(AdminMonitoringThresholdsService);
  private readonly toastService = inject(ToastService);

  form: AdminMonitoringThresholdConfig = {
    ...this.thresholdsService.config(),
  };

  saveThresholds(): void {
    this.thresholdsService.save(this.form);
    this.form = {
      ...this.thresholdsService.config(),
    };
    this.toastService.show({
      title: 'Thresholds saved',
      description: 'Monitoring badge thresholds were updated for the admin dashboard.',
      variant: 'success',
    });
  }

  resetThresholds(): void {
    this.thresholdsService.reset();
    this.form = {
      ...this.thresholdsService.config(),
    };
    this.toastService.show({
      title: 'Thresholds reset',
      description: 'Default monitoring thresholds were restored.',
      variant: 'success',
    });
  }
}
