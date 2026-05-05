import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ChartConfiguration, ChartData } from 'chart.js';

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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly productionService = inject(ProductionService);

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

  loading = true;
  errorMessage: string | null = null;
  productionData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      {
        label: 'Output (kg)',
        data: [],
        backgroundColor: '#ff7a00',
      },
    ],
  };

  ngOnInit(): void {
    this.productionService
      .getProductionChartSeries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.productionData = this.createEmptyChartData();
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.productionData = {
          ...this.productionData,
          labels: response.data.labels,
          datasets: [
            {
              ...this.productionData.datasets[0],
              data: response.data.quantities,
            },
          ],
        };
        this.cdr.markForCheck();
      });
  }

  get hasChartData(): boolean {
    return Array.isArray(this.productionData.labels) && this.productionData.labels.length > 0;
  }

  private createEmptyChartData(): ChartData<'bar'> {
    return {
      labels: [],
      datasets: [
        {
          ...this.productionData.datasets[0],
          data: [],
        },
      ],
    };
  }
}
