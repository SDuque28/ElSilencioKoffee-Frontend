import type { AdminInventoryApi, AdminSnapshotApi } from '../models/admin-api.model';
import type {
  AdminChartSeries,
  AdminDashboardChartReport,
  AdminDashboardReportData,
  AdminDashboardTableReport,
  AdminMetric,
} from '../models/admin-view.model';
import {
  buildAnalytics,
  buildOverview,
  buildProductSummary,
  buildUsersSummary,
  toOrderRows,
} from './admin-calculations';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function buildCompleteAdminProjectReport(
  snapshot: AdminSnapshotApi,
  rolesByUserId: Map<string, string>,
  options?: {
    activeFilterLabel?: string | null;
    activeFilterDescription?: string | null;
  },
): AdminDashboardReportData {
  const overview = buildOverview(snapshot);
  const analytics = buildAnalytics(snapshot);
  const productSummary = buildProductSummary(snapshot.products, snapshot.production, snapshot.inventory);
  const usersSummary = buildUsersSummary(snapshot.users, snapshot.orders, rolesByUserId);
  const orderRows = toOrderRows(snapshot.orders);
  const inventoryMetrics = buildInventoryMetrics(snapshot.inventory);
  const filterLabel = options?.activeFilterLabel?.trim() || 'Admin module snapshot';
  const filterDescription =
    options?.activeFilterDescription?.trim() ||
    'Full admin data available through current frontend services.';

  return {
    title: 'El Silencio Koffee - Complete Admin Project Report',
    filterLabel,
    filterDescription,
    metrics: overview.metrics,
    chartSummaries: [],
    tables: [],
    sections: [
      {
        title: 'General Dashboard KPIs',
        description: 'High-level metrics derived from the same admin overview data used by the dashboard.',
        metrics: overview.metrics,
      },
      {
        title: 'Orders & Purchases Summary',
        metrics: [
          metric('Total Orders', String(snapshot.orders.length), 'All order statuses'),
          metric(
            'Paid Orders',
            String(snapshot.orders.filter((order) => order.status === 'PAID').length),
            'Payment approved',
          ),
          metric(
            'Pending Orders',
            String(snapshot.orders.filter((order) => order.status !== 'PAID').length),
            'Pending payment or delivery',
          ),
        ],
        tables: [
          table(
            'Recent Orders',
            ['Order ID', 'Customer', 'Date', 'Total', 'Payment', 'Status'],
            orderRows.slice(0, 8).map((row) => [
              row.orderCode,
              row.customer,
              row.date,
              row.total,
              row.paymentLabel,
              row.statusLabel,
            ]),
            'Data not available in current frontend/backend implementation',
          ),
        ],
      },
      {
        title: 'Sales & Revenue Summary',
        metrics: analytics.metrics.filter((metric) =>
          ['Total Revenue', 'Avg. Order Value', 'Products Sold', 'Active Customers'].includes(
            metric.label,
          ),
        ),
        chartSummaries: [
          chartSummary(
            'Revenue Performance',
            'Revenue totals by date from paid orders.',
            analytics.revenueSeries,
            [
              metric('Paid Revenue', currencyFormatter.format(sumSeries(analytics.revenueSeries)), 'Across all charted dates'),
              metric('Revenue Date Points', String(analytics.revenueSeries.labels.length), 'Chart labels'),
            ],
          ),
          chartSummary(
            'Order Volume Trend',
            'Order counts by date from the admin analytics dataset.',
            analytics.orderSeries,
            [
              metric('Order Volume Points', String(analytics.orderSeries.labels.length), 'Chart labels'),
              metric('Orders Represented', String(sumSeries(analytics.orderSeries)), 'Chart total'),
            ],
          ),
        ],
        tables: [
          table(
            'Order Status Breakdown',
            ['Status', 'Total Count'],
            [
              ['Paid', String(snapshot.orders.filter((order) => order.status === 'PAID').length)],
              [
                'Processing',
                String(
                  orderRows.filter((row) => row.statusLabel === 'Processing').length,
                ),
              ],
              ['Shipped', String(orderRows.filter((row) => row.statusLabel === 'Shipped').length)],
              [
                'Delivered',
                String(orderRows.filter((row) => row.statusLabel === 'Delivered').length),
              ],
            ],
          ),
        ],
      },
      {
        title: 'Products Summary',
        metrics: productSummary.metrics,
        tables: [
          table(
            'Products',
            ['Name', 'Category', 'Price', 'Stock', 'Status'],
            productSummary.products.slice(0, 8).map((product) => [
              product.name,
              product.category,
              product.price,
              String(product.stock),
              product.statusLabel,
            ]),
            'Data not available in current frontend/backend implementation',
          ),
        ],
      },
      {
        title: 'Inventory & Stock Summary',
        metrics: inventoryMetrics,
        tables: [
          table(
            'Inventory Snapshot',
            ['Product', 'Stock Quantity'],
            snapshot.inventory.slice(0, 8).map((item) => [
              item.productName,
              String(toNumber(item.stockQuantity)),
            ]),
            'Data not available in current frontend/backend implementation',
          ),
        ],
        availabilityMessage:
          snapshot.inventory.length === 0
            ? 'Data not available in current frontend/backend implementation'
            : undefined,
      },
      {
        title: 'Users & Accounts Summary',
        metrics: usersSummary.metrics,
        tables: [
          table(
            'Users',
            ['Name', 'Email', 'Role', 'Status', 'Orders', 'Total Spent'],
            usersSummary.users.slice(0, 8).map((user) => [
              user.name,
              user.email,
              user.role,
              user.statusLabel,
              String(user.totalOrders),
              user.totalSpent,
            ]),
            'Data not available in current frontend/backend implementation',
          ),
        ],
      },
      {
        title: 'Monitoring & Production Summary',
        metrics: overview.monitoring.map((metricItem) =>
          metric(metricItem.label, metricItem.value, metricItem.status),
        ),
        tables: [
          table(
            'Production Records',
            ['Variety', 'Section', 'Collection Date', 'Quantity (kg)'],
            snapshot.production.slice(0, 8).map((record) => [
              record.varietyName,
              record.sectionName,
              record.collectionDate,
              String(record.quantityKg),
            ]),
            'Data not available in current frontend/backend implementation',
          ),
        ],
      },
      {
        title: 'Quotes & Approvals Summary',
        availabilityMessage: 'Data not available in current frontend/backend implementation.',
      },
    ],
    notes: uniqueNotes([
      options?.activeFilterLabel
        ? `The admin dashboard filter active at export time was "${options.activeFilterLabel}". This report still includes the full admin snapshot.`
        : '',
      'Chart image export is not enabled yet; chart sections include structured data summaries for future visual export support.',
    ]),
  };
}

function buildInventoryMetrics(inventory: AdminInventoryApi[]): AdminMetric[] {
  const totalUnits = inventory.reduce((sum, item) => sum + toNumber(item.stockQuantity), 0);
  const lowStockItems = inventory.filter((item) => toNumber(item.stockQuantity) <= 10).length;
  const outOfStockItems = inventory.filter((item) => toNumber(item.stockQuantity) <= 0).length;

  return [
    metric('Tracked Inventory Items', String(inventory.length), 'Inventory endpoint snapshot'),
    metric('Total Units in Stock', String(totalUnits), 'Current inventory quantity'),
    metric('Low Stock Items', String(lowStockItems), '10 units or fewer'),
    metric('Out of Stock Items', String(outOfStockItems), 'Needs replenishment'),
  ];
}

function chartSummary(
  title: string,
  subtitle: string,
  series: AdminChartSeries,
  metrics: AdminMetric[],
): AdminDashboardChartReport {
  return {
    title,
    subtitle,
    series,
    summary: metrics.map((entry) => ({
      label: entry.label,
      value: entry.change ? `${entry.value} (${entry.change})` : entry.value,
    })),
    imageDataUrl: null,
  };
}

function table(
  title: string,
  columns: string[],
  rows: string[][],
  emptyMessage = 'No data available.',
): AdminDashboardTableReport {
  return {
    title,
    columns,
    rows,
    emptyMessage,
  };
}

function metric(label: string, value: string, change?: string): AdminMetric {
  return {
    label,
    value,
    change,
  };
}

function sumSeries(series: AdminChartSeries): number {
  return series.values.reduce((sum, value) => sum + value, 0);
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function uniqueNotes(notes: string[]): string[] {
  return Array.from(new Set(notes.filter((note) => note.trim().length > 0)));
}
