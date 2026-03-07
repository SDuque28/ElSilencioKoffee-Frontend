import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { ChartData } from 'chart.js';

import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';

@Component({
  selector: 'app-production-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './production-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionPageComponent {
  readonly productionData: ChartData<'bar'> = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Output (kg)',
        data: [820, 790, 915, 870],
        backgroundColor: '#6d3a1a',
      },
    ],
  };
}
