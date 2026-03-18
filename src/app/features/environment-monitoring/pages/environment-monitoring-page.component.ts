import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartConfiguration, ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';
import { EnvironmentMonitoringService } from '../services/environment-monitoring.service';

@Component({
  selector: 'app-environment-monitoring-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './environment-monitoring-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentMonitoringPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly environmentService = inject(EnvironmentMonitoringService);

  readonly chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#e5e5e5',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },
      y: {
        ticks: {
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255,255,255,0.08)',
        },
      },
    },
  };

  temperatureData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [],
        borderColor: '#ff7a00',
        backgroundColor: 'rgba(255, 122, 0, 0.22)',
        fill: true,
      },
    ],
  };

  humidityData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Humidity (%)',
        data: [],
        borderColor: '#ff9d3c',
        backgroundColor: 'rgba(255, 157, 60, 0.18)',
        fill: true,
      },
    ],
  };

  ngOnInit(): void {
    this.environmentService
      .listReadings()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (!isApiSuccessResponse(response)) {
          return;
        }

        const labels = response.data.map((reading) => reading.timestamp.slice(11, 16));

        this.temperatureData = {
          ...this.temperatureData,
          labels,
          datasets: [
            {
              ...this.temperatureData.datasets[0],
              data: response.data.map((reading) => reading.temperature),
            },
          ],
        };

        this.humidityData = {
          ...this.humidityData,
          labels,
          datasets: [
            {
              ...this.humidityData.datasets[0],
              data: response.data.map((reading) => reading.humidity),
            },
          ],
        };
      });
  }
}
