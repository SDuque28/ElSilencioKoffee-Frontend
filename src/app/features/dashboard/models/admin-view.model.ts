import type {
  AdminDeliveryApi,
  AdminOrderApi,
  AdminPaymentApi,
  AdminShippingApi,
} from './admin-api.model';

export type AdminBadgeTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';
export type AdminDashboardDateFilterKey = 'all-time' | 'last-7-days';

export interface AdminMetric {
  label: string;
  value: string;
  change?: string;
  tone?: AdminBadgeTone;
}

export interface AdminDashboardDateFilterState {
  key: AdminDashboardDateFilterKey;
  label: string;
  description: string;
  isRangeFiltered: boolean;
  rangeStart: string | null;
  rangeEnd: string | null;
}

export interface AdminChartSeries {
  labels: string[];
  values: number[];
}

export interface AdminStatusChartSeries {
  labels: string[];
  paid: number[];
  processing: number[];
  shipped: number[];
  delivered: number[];
}

export interface AdminOverview {
  metrics: AdminMetric[];
  revenueSeries: AdminChartSeries;
  orderSeries: AdminChartSeries;
  monitoring: AdminMonitoringMetric[];
  recentOrders: AdminOrderRow[];
  activeFilter: AdminDashboardDateFilterState;
  report: AdminDashboardReportData;
}

export interface AdminAnalytics {
  metrics: AdminMetric[];
  revenueSeries: AdminChartSeries;
  orderSeries: AdminChartSeries;
  statusSeries: AdminStatusChartSeries;
  recentOrders: AdminOrderRow[];
  monitoring: AdminMonitoringMetric[];
}

export interface AdminMonitoringMetric {
  label: string;
  value: string;
  status: string;
  tone: AdminBadgeTone;
}

export interface AdminOrderRow {
  id: string | number;
  orderCode: string;
  customer: string;
  customerEmail: string;
  date: string;
  rawDate: string;
  total: string;
  totalValue: number;
  paymentLabel: string;
  paymentTone: AdminBadgeTone;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  source: AdminOrderApi;
}

export interface AdminOrderDetail {
  id: string | number;
  orderCode: string;
  customer: string;
  customerEmail: string;
  date: string;
  total: string;
  payment?: AdminPaymentApi | null;
  deliveryOrder?: AdminDeliveryApi | null;
  shippingInformation?: AdminShippingApi | null;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  items: AdminOrderDetailItem[];
  source: AdminOrderApi;
}

export interface AdminOrderDetailItem {
  productName: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
}

export interface AdminProductRow {
  id: number;
  name: string;
  imageUrl: string | null;
  category: string;
  price: string;
  priceValue: number;
  stock: number;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  featuredLabel: string;
  presentationId: number | null;
  productionId: number | null;
}

export interface AdminProductSummary {
  metrics: AdminMetric[];
  products: AdminProductRow[];
  presentationOptions: AdminSelectOption[];
  productionOptions: AdminSelectOption[];
}

export interface AdminUserRow {
  id: string | number;
  name: string;
  email: string;
  role: string;
  statusLabel: string;
  statusTone: AdminBadgeTone;
  totalOrders: number;
  totalSpent: string;
  averageOrderValue: string;
}

export interface AdminUsersSummary {
  metrics: AdminMetric[];
  users: AdminUserRow[];
}

export interface AdminSelectOption {
  value: number;
  label: string;
}

export interface AdminDashboardReportSummaryItem {
  label: string;
  value: string;
}

export interface AdminDashboardChartReport {
  title: string;
  subtitle: string;
  series: AdminChartSeries;
  summary: AdminDashboardReportSummaryItem[];
  imageDataUrl?: string | null;
}

export interface AdminDashboardTableReport {
  title: string;
  columns: string[];
  rows: string[][];
  emptyMessage?: string;
}

export interface AdminDashboardReportSection {
  title: string;
  description?: string;
  metrics?: AdminMetric[];
  chartSummaries?: AdminDashboardChartReport[];
  tables?: AdminDashboardTableReport[];
  availabilityMessage?: string;
}

export interface AdminDashboardReportData {
  title: string;
  filterLabel: string;
  filterDescription: string;
  metrics: AdminMetric[];
  chartSummaries: AdminDashboardChartReport[];
  tables: AdminDashboardTableReport[];
  notes: string[];
  sections?: AdminDashboardReportSection[];
}

export type AdminNotificationCategory =
  | 'order'
  | 'inventory'
  | 'product'
  | 'sales'
  | 'system';

export interface AdminNotificationItem {
  id: string;
  title: string;
  description: string;
  category: AdminNotificationCategory;
  createdAt: string;
  relativeTime: string;
  route: string;
  tone: AdminBadgeTone;
  unread: boolean;
}
