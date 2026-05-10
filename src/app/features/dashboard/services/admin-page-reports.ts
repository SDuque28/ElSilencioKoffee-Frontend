import type {
  AdminDashboardReportData,
  AdminMetric,
  AdminOrderRow,
  AdminProductRow,
} from '../models/admin-view.model';

export function buildOrdersPageReport(input: {
  metrics: AdminMetric[];
  rows: AdminOrderRow[];
  statusFilterLabel: string;
  dateFilterLabel: string;
}): AdminDashboardReportData {
  const filterDescription = `Status: ${input.statusFilterLabel} | Date: ${input.dateFilterLabel}`;

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
  categoryFilterLabel: string;
  stockFilterLabel: string;
  priceRangeFilterLabel: string;
}): AdminDashboardReportData {
  const filterDescription = `Category: ${input.categoryFilterLabel} | Stock: ${input.stockFilterLabel} | Price: ${input.priceRangeFilterLabel}`;

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
