import { ChangeDetectionStrategy, Component, DestroyRef, inject, type OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartData } from 'chart.js';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { ChartContainerComponent } from '../../../shared/ui/chart/chart-container.component';
import { ProductionService } from '../services/production.service';

@Component({
  selector: 'app-production-page',
  imports: [CardComponent, ChartContainerComponent],
  templateUrl: './production-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductionPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly productionService = inject(ProductionService);

  productionData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Output (kg)',
        data: [],
        backgroundColor: '#6d3a1a',
      },
    ],
  };

  ngOnInit(): void {
    this.productionService
      .listProduction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        if (!isApiSuccessResponse(response)) {
          return;
        }

        this.productionData = {
          ...this.productionData,
          labels: response.data.map((record) => record.date),
          datasets: [
            {
              ...this.productionData.datasets[0],
              data: response.data.map((record) => record.quantity),
            },
          ],
        };
      });
  }
}
