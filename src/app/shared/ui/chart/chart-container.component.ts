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
import { NgClass } from '@angular/common';
import { Chart, type ChartConfiguration, type ChartData, type ChartType } from 'chart.js/auto';

@Component({
  selector: 'app-chart-container',
  imports: [NgClass],
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
  @Input() dataCy: string | null = null;
  @Input() surface: 'light' | 'dark' = 'light';

  private chart: Chart | null = null;

  get containerClasses(): string {
    return this.surface === 'dark'
      ? 'h-72 rounded-lg border border-white/10 bg-[#101011] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]'
      : 'h-72 rounded-xl border border-border bg-white p-4 shadow-soft';
  }

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
