import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewChild,
  type AfterViewInit,
  type ElementRef,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
} from '@angular/core';
import { Chart, type ChartConfiguration, type ChartData, type ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-container',
  templateUrl: './chart-container.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartContainerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvasRef', { static: true })
  private readonly canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: ChartType = 'bar';
  @Input() data: ChartData = {
    labels: [],
    datasets: [],
  };
  @Input() options: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
  };

  private chart: Chart | null = null;

  ngAfterViewInit(): void {
    this.renderChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.canvasRef || (!changes['data'] && !changes['type'] && !changes['options'])) {
      return;
    }

    this.renderChart();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  private renderChart(): void {
    this.chart?.destroy();

    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.type,
      data: this.data,
      options: this.options,
    });
  }
}
