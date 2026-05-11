import type {
  AdminAnalytics,
  AdminDashboardReportData,
  AdminMetric,
  AdminOrderRow,
  AdminProductRow,
} from '../models/admin-view.model';

export function buildOrdersPageReport(input: {
  metrics: AdminMetric[];
  rows: AdminOrderRow[];
  searchLabel: string;
  statusFilterLabel: string;
  dateFilterLabel: string;
}): AdminDashboardReportData {
  const filterDescription = `Search: ${input.searchLabel} | Status: ${input.statusFilterLabel} | Date: ${input.dateFilterLabel}`;

  return {
    title: 'Admin Orders Report',
    filterLabel: 'Orders page filters',
    filterDescription,
    metrics: input.metrics,
    chartSummaries: [],
    tables: [
      {
        title: 'Orders',
        columns: ['Order ID', 'Customer', 'Email', 'Date', 'Total', 'Payment', 'Status'],
        rows: input.rows.map((row) => [
          row.orderCode,
          row.customer,
          row.customerEmail,
          row.date,
          row.total,
          row.paymentLabel,
          row.statusLabel,
        ]),
        emptyMessage: 'No orders match the current filters.',
      },
    ],
    notes: ['This report was generated from the current orders table filters in the admin dashboard.'],
  };
}

export function buildProductsPageReport(input: {
  metrics: AdminMetric[];
  rows: AdminProductRow[];
  searchLabel: string;
  categoryFilterLabel: string;
  stockFilterLabel: string;
  priceRangeFilterLabel: string;
}): AdminDashboardReportData {
  const filterDescription = `Search: ${input.searchLabel} | Category: ${input.categoryFilterLabel} | Stock: ${input.stockFilterLabel} | Price: ${input.priceRangeFilterLabel}`;

  return {
    title: 'Admin Products Report',
    filterLabel: 'Products page filters',
    filterDescription,
    metrics: input.metrics,
    chartSummaries: [],
    tables: [
      {
        title: 'Products',
        columns: ['Name', 'Category', 'Price', 'Stock', 'Status', 'Featured'],
        rows: input.rows.map((row) => [
          row.name,
          row.category,
          row.price,
          String(row.stock),
          row.statusLabel,
          row.featuredLabel,
        ]),
        emptyMessage: 'No products match the current filters.',
      },
    ],
    notes: [
      'This report was generated from the current products table filters in the admin dashboard.',
      'Featured filtering is not available because the current admin snapshot does not expose featured product data.',
    ],
  };
}

export function buildAnalyticsPageReport(input: {
  analytics: AdminAnalytics;
  searchLabel: string;
  chartTabLabel: string;
  statusTabLabel: string;
  rows: AdminOrderRow[];
}): AdminDashboardReportData {
  return {
    title: 'Admin Analytics Report',
    filterLabel: 'Analytics page filters',
    filterDescription: `Search: ${input.searchLabel} | Sales chart: ${input.chartTabLabel} | Status chart: ${input.statusTabLabel}`,
    metrics: input.analytics.metrics,
    chartSummaries: [
      {
        title: 'Revenue trend',
        subtitle: 'Aggregated paid revenue by date from admin analytics data.',
        series: input.analytics.revenueSeries,
        summary: [
          { label: 'Data points', value: String(input.analytics.revenueSeries.labels.length) },
          {
            label: 'Recent orders',
            value: String(input.rows.length),
          },
        ],
      },
      {
        title: 'Order volume trend',
        subtitle: 'Aggregated total order count by date from admin analytics data.',
        series: input.analytics.orderSeries,
        summary: [
          { label: 'Data points', value: String(input.analytics.orderSeries.labels.length) },
          {
            label: 'Monitoring metrics',
            value: String(input.analytics.monitoring.length),
          },
        ],
      },
    ],
    tables: [
      {
        title: 'Recent Orders',
        columns: ['Order ID', 'Customer', 'Date', 'Total', 'Status'],
        rows: input.rows.map((row) => [
          row.orderCode,
          row.customer,
          row.date,
          row.total,
          row.statusLabel,
        ]),
        emptyMessage: 'No recent orders match the current analytics search.',
      },
      {
        title: 'Monitoring Snapshot',
        columns: ['Metric', 'Value', 'Status'],
        rows: input.analytics.monitoring.map((metric) => [metric.label, metric.value, metric.status]),
      },
    ],
    notes: [
      'This report was generated from the current analytics page state in the admin dashboard.',
      'Chart tabs affect the on-screen visualization; the report includes both revenue and order volume summaries.',
    ],
  };
}
