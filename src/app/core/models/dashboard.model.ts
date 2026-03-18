export interface DashboardMetric {
  label: string;
  value: string;
}

export interface SalesMetric {
  label: string;
  value: number;
}

export interface TopBuyer {
  name: string;
  purchases: number;
  totalSpend: number;
}
