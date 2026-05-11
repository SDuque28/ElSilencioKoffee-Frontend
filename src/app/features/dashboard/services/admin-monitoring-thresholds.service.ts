import { Injectable, signal } from '@angular/core';

import type { AdminMonitoringThresholdConfig } from '../models/admin-view.model';

const STORAGE_KEY = 'esk.admin.monitoring-thresholds';

const DEFAULT_THRESHOLDS: AdminMonitoringThresholdConfig = {
  temperatureMin: 18,
  temperatureMax: 24,
  humidityMin: 45,
  humidityMax: 60,
  co2Max: 700,
};

@Injectable({
  providedIn: 'root',
})
export class AdminMonitoringThresholdsService {
  private readonly _config = signal<AdminMonitoringThresholdConfig>(this.readConfig());

  readonly config = this._config.asReadonly();

  save(nextConfig: AdminMonitoringThresholdConfig): void {
    const normalized = this.normalize(nextConfig);
    this._config.set(normalized);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  }

  reset(): void {
    this._config.set(DEFAULT_THRESHOLDS);
    localStorage.removeItem(STORAGE_KEY);
  }

  private readConfig(): AdminMonitoringThresholdConfig {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return DEFAULT_THRESHOLDS;
    }

    try {
      return this.normalize(JSON.parse(raw) as Partial<AdminMonitoringThresholdConfig>);
    } catch {
      return DEFAULT_THRESHOLDS;
    }
  }

  private normalize(
    value: Partial<AdminMonitoringThresholdConfig> | AdminMonitoringThresholdConfig,
  ): AdminMonitoringThresholdConfig {
    return {
      temperatureMin: this.toNumber(value.temperatureMin, DEFAULT_THRESHOLDS.temperatureMin),
      temperatureMax: this.toNumber(value.temperatureMax, DEFAULT_THRESHOLDS.temperatureMax),
      humidityMin: this.toNumber(value.humidityMin, DEFAULT_THRESHOLDS.humidityMin),
      humidityMax: this.toNumber(value.humidityMax, DEFAULT_THRESHOLDS.humidityMax),
      co2Max: this.toNumber(value.co2Max, DEFAULT_THRESHOLDS.co2Max),
    };
  }

  private toNumber(value: unknown, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
