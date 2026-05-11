export interface DashboardMetric {
  label: string;
  value: string;
}

export interface ChartSeries {
  labels: string[];
  values: number[];
}

export interface SalesMetric {
  label: string;
  value: number;
}

export interface DashboardOverview {
  metrics: DashboardMetric[];
  revenueSeries: ChartSeries;
}

export interface TopBuyer {
  name: string;
  purchases: number;
  totalSpend: number;
}
