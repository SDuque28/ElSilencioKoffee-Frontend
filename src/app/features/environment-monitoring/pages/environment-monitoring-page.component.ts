import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ChartData } from 'chart.js';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-environment-monitoring-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './environment-monitoring-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnvironmentMonitoringPageComponent {
  readonly temperatureData: ChartData<'line'> = {
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
    datasets: [
      {
        label: 'Temperature (°C)',
        data: [21.2, 22.4, 24.1, 25.0, 23.8],
        borderColor: '#a43023',
        backgroundColor: 'rgba(164, 48, 35, 0.2)',
        fill: true,
      },
    ],
  };

  readonly humidityData: ChartData<'line'> = {
    labels: ['08:00', '10:00', '12:00', '14:00', '16:00'],
    datasets: [
      {
        label: 'Humidity (%)',
        data: [68, 65, 62, 59, 63],
        borderColor: '#2f6f54',
        backgroundColor: 'rgba(47, 111, 84, 0.2)',
        fill: true,
      },
    ],
  };
}
