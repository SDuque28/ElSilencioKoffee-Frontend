import type {
  AdminEnvironmentMetricApi,
  AdminOrderApi,
  AdminProductApi,
  AdminProductionApi,
  AdminSnapshotApi,
  AdminUserApi,
} from '../models/admin-api.model';
import type {
  AdminAnalytics,
  AdminBadgeTone,
  AdminChartSeries,
  AdminDashboardReportData,
  AdminDashboardDateFilterState,
  AdminMetric,
  AdminMonitoringMetric,
  AdminMonitoringThresholdConfig,
  AdminOrderDetail,
  AdminOrderDetailItem,
  AdminOrderRow,
  AdminProductRow,
  AdminProductSummary,
  AdminSelectOption,
  AdminStatusChartSeries,
  AdminUsersSummary,
  AdminUserRow,
  AdminOverview,
} from '../models/admin-view.model';

const LOW_STOCK_THRESHOLD = 10;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const compactCurrencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
});

export function buildOverview(
  snapshot: AdminSnapshotApi,
  options: {
    filter?: AdminDashboardDateFilterState;
    notes?: string[];
    thresholdConfig?: AdminMonitoringThresholdConfig;
  } = {},
): AdminOverview {
  const paidOrders = snapshot.orders.filter((order) => order.status === 'PAID');
  const recentOrders = toRecentOrders(snapshot.orders, 5);
  const totalRevenue = sumOrders(paidOrders);
  const activeFilter = options.filter ?? {
    key: 'all-time',
    label: 'All Time',
    description: 'All available dashboard data',
    isRangeFiltered: false,
    rangeStart: null,
    rangeEnd: null,
  };
  const orderMetricLabel = activeFilter.isRangeFiltered ? 'Orders in Range' : 'Orders Today';
  const orderMetricValue = activeFilter.isRangeFiltered
    ? snapshot.orders.length
    : countOrdersOnLatestSeedDay(snapshot.orders);
  const activeUsers = activeFilter.isRangeFiltered
    ? countActiveUsersInOrders(snapshot.orders, snapshot.users)
    : snapshot.users.filter((user) => user.activo).length;
  const lowStock = snapshot.products.filter(
    (product) => toNumber(product.stockQuantity) <= LOW_STOCK_THRESHOLD,
  ).length;
  const revenueSeries = buildRevenueSeries(snapshot.orders);
  const orderSeries = buildOrderSeries(snapshot.orders);
  const monitoring = buildMonitoring(snapshot.environmentMetrics, options.thresholdConfig);
  const metrics = [
    metric(
      'Total Sales',
      formatCurrency(totalRevenue),
      activeFilter.isRangeFiltered ? activeFilter.description : '+12.5%',
      'success',
    ),
    metric(
      orderMetricLabel,
      String(orderMetricValue),
      activeFilter.isRangeFiltered ? activeFilter.label : '+5.3%',
      'success',
    ),
    metric(
      'Active Users',
      String(activeUsers),
      activeFilter.isRangeFiltered ? 'Users with orders in the active range' : 'Live',
      'info',
    ),
    metric(
      'Low Stock',
      `${lowStock} Items`,
      activeFilter.isRangeFiltered
        ? 'Inventory snapshot'
        : lowStock > 0
          ? 'Action Required'
          : 'Stable',
      lowStock > 0 ? 'warning' : 'success',
    ),
  ];

  return {
    metrics,
    revenueSeries,
    orderSeries,
    monitoring,
    recentOrders,
    activeFilter,
    report: buildOverviewReport({
      metrics,
      revenueSeries,
      monitoring,
      recentOrders,
      activeFilter,
      notes: options.notes ?? [],
      orderCount: snapshot.orders.length,
      totalRevenue,
    }),
  };
}

export function buildAnalytics(
  snapshot: AdminSnapshotApi,
  options: {
    thresholdConfig?: AdminMonitoringThresholdConfig;
  } = {},
): AdminAnalytics {
  const paidOrders = snapshot.orders.filter((order) => order.status === 'PAID');
  const processingOrders = snapshot.orders.filter((order) => deliveryState(order).label === 'Processing');
  const shippedOrders = snapshot.orders.filter((order) => deliveryState(order).label === 'Shipped');
  const deliveredOrders = snapshot.orders.filter((order) => deliveryState(order).label === 'Delivered');
  const revenue = sumOrders(paidOrders);
  const averageOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;
  const activeCustomers = snapshot.users.filter((user) => user.activo).length;
  const productsSold = snapshot.orders
    .flatMap((order) => order.items ?? [])
    .reduce((sum, item) => sum + toNumber(item.quantity), 0);

  return {
    metrics: [
      metric('Total Revenue', formatCurrency(revenue), '+12.5%', 'success'),
      metric('Avg. Order Value', formatCurrency(averageOrderValue), 'Live data', 'neutral'),
      metric('Total Orders', String(snapshot.orders.length), 'All statuses', 'info'),
      metric('Active Customers', String(activeCustomers), '+15.3%', 'success'),
      metric('Paid Orders', String(paidOrders.length), 'Payment approved', 'success'),
      metric('Processing', String(processingOrders.length), 'Delivery pending', 'warning'),
      metric('Shipped', String(shippedOrders.length), 'Out for shipment', 'info'),
      metric('Delivered', String(deliveredOrders.length), 'Completed', 'success'),
      metric('Products Sold', String(productsSold), 'Order items', 'info'),
      metric('Conversion Rate', 'N/A', 'No sessions endpoint', 'neutral'),
    ],
    revenueSeries: buildRevenueSeries(snapshot.orders),
    orderSeries: buildOrderSeries(snapshot.orders),
    statusSeries: buildStatusSeries(snapshot.orders),
    recentOrders: toRecentOrders(snapshot.orders, 6),
    monitoring: buildMonitoring(snapshot.environmentMetrics, options.thresholdConfig),
  };
}

export function buildProductSummary(
  products: AdminProductApi[],
  production: AdminProductionApi[],
): AdminProductSummary {
  const rows = products.map(toProductRow);
  const activeListings = rows.filter((product) => product.stock > 0).length;
  const lowStock = rows.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length;
  const averagePrice =
    rows.length > 0 ? rows.reduce((sum, product) => sum + product.priceValue, 0) / rows.length : 0;

  return {
    metrics: [
      metric('Total Products', String(rows.length), 'Live catalog', 'info'),
      metric('Active Listings', String(activeListings), 'Stock > 0', 'success'),
      metric('Low-Stock Alert', String(lowStock), lowStock > 0 ? 'Review stock' : 'Stable', lowStock > 0 ? 'warning' : 'success'),
      metric('Avg. Unit Price', formatCurrency(averagePrice), 'Calculated', 'success'),
    ],
    products: rows,
    presentationOptions: buildPresentationOptions(products),
    productionOptions: buildProductionOptions(production),
  };
}

export function buildUsersSummary(
  users: AdminUserApi[],
  orders: AdminOrderApi[],
  rolesByUserId: Map<string, string>,
): AdminUsersSummary {
  const rows = users.map((user) => toUserRow(user, orders, rolesByUserId));
  const paidOrders = orders.filter((order) => order.status === 'PAID');
  const revenue = sumOrders(paidOrders);
  const averageOrderValue = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

  return {
    metrics: [
      metric('Total Active Customers', String(rows.filter((row) => row.statusLabel === 'Active').length), '+4.5%', 'success'),
      metric('Average Order Value', formatCurrency(averageOrderValue), 'From paid orders', 'warning'),
      metric('Admin Activity Rate', 'N/A', 'No activity endpoint', 'neutral'),
    ],
    users: rows,
  };
}

export function toOrderDetail(order: AdminOrderApi): AdminOrderDetail {
  const row = toOrderRow(order);

  return {
    id: order.id,
    orderCode: row.orderCode,
    customer: row.customer,
    customerEmail: row.customerEmail,
    date: row.date,
    total: row.total,
    payment: order.payment ?? null,
    deliveryOrder: order.deliveryOrder ?? null,
    shippingInformation: order.shippingInformation ?? null,
    statusLabel: row.statusLabel,
    statusTone: row.statusTone,
    items: (order.items ?? []).map(toOrderDetailItem),
    source: order,
  };
}

export function toOrderRows(orders: AdminOrderApi[]): AdminOrderRow[] {
  return orders.map(toOrderRow);
}

export function buildMonitoring(
  metrics: AdminEnvironmentMetricApi[],
  thresholdConfig?: AdminMonitoringThresholdConfig,
): AdminMonitoringMetric[] {
  const latestTemperature = latestMetric(metrics, 'temperature');
  const latestHumidity = latestMetric(metrics, 'humidity');
  const co2Metric = latestMetric(metrics, 'co2');
  const thresholds = thresholdConfig ?? {
    temperatureMin: 18,
    temperatureMax: 24,
    humidityMin: 45,
    humidityMax: 60,
    co2Max: 700,
  };
  const temperatureState = rangeStatus(
    latestTemperature?.value,
    thresholds.temperatureMin,
    thresholds.temperatureMax,
    {
      optimalLabel: 'OPTIMAL',
      lowLabel: 'LOW',
      highLabel: 'HIGH',
    },
  );
  const humidityState = rangeStatus(
    latestHumidity?.value,
    thresholds.humidityMin,
    thresholds.humidityMax,
    {
      optimalLabel: 'OPTIMAL',
      lowLabel: 'LOW',
      highLabel: 'HIGH',
    },
  );
  const co2State = upperBoundStatus(co2Metric?.value, thresholds.co2Max, {
    optimalLabel: 'NORMAL',
    highLabel: 'ELEVATED',
  });

  return [
    {
      label: 'Temperature',
      value: latestTemperature ? `${toNumber(latestTemperature.value).toFixed(1)}${latestTemperature.unit}` : 'N/A',
      status: temperatureState.label,
      tone: temperatureState.tone,
    },
    {
      label: 'Humidity',
      value: latestHumidity ? `${toNumber(latestHumidity.value).toFixed(1)}${latestHumidity.unit}` : 'N/A',
      status: humidityState.label,
      tone: humidityState.tone,
    },
    {
      label: 'CO2 Levels',
      value: co2Metric ? `${toNumber(co2Metric.value).toFixed(0)} ${co2Metric.unit}` : '412 ppm',
      status: co2Metric ? co2State.label : 'SIMULATED',
      tone: co2Metric ? co2State.tone : 'info',
    },
  ];
}

function toOrderRow(order: AdminOrderApi): AdminOrderRow {
  const payment = paymentState(order);
  const delivery = deliveryState(order);
  const customer = order.customer?.username ?? `User #${order.userId}`;

  return {
    id: order.id,
    orderCode: `#COF-${String(order.id).padStart(4, '0')}`,
    customer,
    customerEmail: order.customer?.email ?? 'N/A',
    date: formatDate(order.orderDate),
    rawDate: order.orderDate,
    total: formatCurrency(toNumber(order.totalAmount)),
    totalValue: toNumber(order.totalAmount),
    paymentLabel: payment.label,
    paymentTone: payment.tone,
    statusLabel: delivery.label,
    statusTone: delivery.tone,
    source: order,
  };
}

function toOrderDetailItem(item: AdminOrderDetailItemApiLike): AdminOrderDetailItem {
  return {
    productName: item.productName,
    quantity: toNumber(item.quantity),
    unitPrice: formatCurrency(toNumber(item.unitPrice)),
    subtotal: formatCurrency(toNumber(item.subtotal)),
  };
}

interface AdminOrderDetailItemApiLike {
  productName: string;
  quantity: number | string;
  unitPrice: number | string;
  subtotal: number | string;
}

function toProductRow(product: AdminProductApi): AdminProductRow {
  const stock = toNumber(product.stockQuantity);
  const status = productStatus(stock);

  return {
    id: product.id,
    name: product.name,
    imageUrl: product.imageUrl,
    category: presentationLabel(toNullableNumber(product.presentationId)),
    price: formatCurrency(toNumber(product.price)),
    priceValue: toNumber(product.price),
    stock,
    statusLabel: status.label,
    statusTone: status.tone,
    featuredLabel: 'N/A',
    presentationId: toNullableNumber(product.presentationId),
    productionId: toNullableNumber(product.productionId),
  };
}

function toUserRow(
  user: AdminUserApi,
  orders: AdminOrderApi[],
  rolesByUserId: Map<string, string>,
): AdminUserRow {
  const userOrders = orders.filter((order) => String(order.userId) === String(user.id));
  const spent = sumOrders(userOrders.filter((order) => order.status === 'PAID'));
  const average = userOrders.length > 0 ? spent / userOrders.length : 0;

  return {
    id: user.id,
    name: user.username,
    email: user.email,
    role: rolesByUserId.get(String(user.id)) ?? 'N/A',
    statusLabel: user.activo ? 'Active' : 'Inactive',
    statusTone: user.activo ? 'success' : 'danger',
    totalOrders: userOrders.length,
    totalSpent: formatCurrency(spent),
    averageOrderValue: formatCurrency(average),
  };
}

function buildRevenueSeries(orders: AdminOrderApi[]): AdminChartSeries {
  return buildDailySeries(
    orders.filter((order) => order.status === 'PAID'),
    (order) => toNumber(order.totalAmount),
  );
}

function buildOrderSeries(orders: AdminOrderApi[]): AdminChartSeries {
  return buildDailySeries(orders, () => 1);
}

function buildStatusSeries(orders: AdminOrderApi[]): AdminStatusChartSeries {
  const dateKeys = uniqueSortedDateKeys(orders);

  return {
    labels: dateKeys.map(formatShortDate),
    paid: dateKeys.map((dateKey) =>
      countByDate(
        orders,
        dateKey,
        (order) => order.status === 'PAID' || order.payment?.status === 'APPROVED',
      ),
    ),
    processing: dateKeys.map((dateKey) =>
      countByDate(orders, dateKey, (order) => deliveryState(order).label === 'Processing'),
    ),
    shipped: dateKeys.map((dateKey) =>
      countByDate(orders, dateKey, (order) => deliveryState(order).label === 'Shipped'),
    ),
    delivered: dateKeys.map((dateKey) =>
      countByDate(orders, dateKey, (order) => deliveryState(order).label === 'Delivered'),
    ),
  };
}

function buildDailySeries(orders: AdminOrderApi[], valueFactory: (order: AdminOrderApi) => number): AdminChartSeries {
  const totalsByDate = new Map<string, number>();

  for (const order of orders) {
    const dateKey = toDateKey(order.orderDate);
    if (!dateKey) {
      continue;
    }
    totalsByDate.set(dateKey, (totalsByDate.get(dateKey) ?? 0) + valueFactory(order));
  }

  const entries = Array.from(totalsByDate.entries()).sort(([left], [right]) =>
    left.localeCompare(right),
  );

  return {
    labels: entries.map(([dateKey]) => formatShortDate(dateKey)),
    values: entries.map(([, value]) => Math.round(value * 100) / 100),
  };
}

function toRecentOrders(orders: AdminOrderApi[], limit: number): AdminOrderRow[] {
  return [...orders]
    .sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime())
    .slice(0, limit)
    .map(toOrderRow);
}

function sumOrders(orders: AdminOrderApi[]): number {
  return orders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0);
}

function countActiveUsersInOrders(orders: AdminOrderApi[], users: AdminUserApi[]): number {
  const activeUserIds = new Set(
    users.filter((user) => user.activo).map((user) => String(user.id)),
  );
  const usersInOrders = new Set(orders.map((order) => String(order.userId)));

  return Array.from(usersInOrders).filter((userId) => activeUserIds.has(userId)).length;
}

function countOrdersOnLatestSeedDay(orders: AdminOrderApi[]): number {
  const keys = orders.map((order) => toDateKey(order.orderDate)).filter((key): key is string => !!key);
  const latest = keys.sort().at(-1);
  return latest ? keys.filter((key) => key === latest).length : 0;
}

function uniqueSortedDateKeys(orders: AdminOrderApi[]): string[] {
  return Array.from(
    new Set(orders.map((order) => toDateKey(order.orderDate)).filter((key): key is string => !!key)),
  ).sort((left, right) => left.localeCompare(right));
}

function buildOverviewReport({
  metrics,
  revenueSeries,
  monitoring,
  recentOrders,
  activeFilter,
  notes,
  orderCount,
  totalRevenue,
}: {
  metrics: AdminMetric[];
  revenueSeries: AdminChartSeries;
  monitoring: AdminMonitoringMetric[];
  recentOrders: AdminOrderRow[];
  activeFilter: AdminDashboardDateFilterState;
  notes: string[];
  orderCount: number;
  totalRevenue: number;
}): AdminDashboardReportData {
  const peakPoint = revenueSeries.values.reduce<{ label: string; value: number } | null>(
    (current, value, index) => {
      if (!current || value > current.value) {
        return {
          label: revenueSeries.labels[index] ?? 'N/A',
          value,
        };
      }
      return current;
    },
    null,
  );

  return {
    title: 'Admin Dashboard Report',
    filterLabel: activeFilter.label,
    filterDescription: activeFilter.description,
    metrics,
    chartSummaries: [
      {
        title: 'Sales Analytics',
        subtitle: 'Structured chart summary generated from the same filtered dashboard data.',
        series: revenueSeries,
        summary: [
          {
            label: 'Date points',
            value: String(revenueSeries.labels.length),
          },
          {
            label: 'Filtered orders',
            value: String(orderCount),
          },
          {
            label: 'Filtered paid revenue',
            value: formatCurrency(totalRevenue),
          },
          {
            label: 'Peak revenue date',
            value: peakPoint ? `${peakPoint.label} (${formatCurrency(peakPoint.value)})` : 'No data',
          },
        ],
        imageDataUrl: null,
      },
    ],
    tables: [
      {
        title: 'Roastery Monitoring',
        columns: ['Metric', 'Value', 'Status'],
        rows: monitoring.map((metric) => [metric.label, metric.value, metric.status]),
      },
      {
        title: 'Recent Orders',
        columns: ['Order ID', 'Customer', 'Date', 'Total', 'Status'],
        rows: recentOrders.map((order) => [
          order.orderCode,
          order.customer,
          order.date,
          order.total,
          order.statusLabel,
        ]),
      },
    ],
    notes: uniqueNotes([
      'Chart image export is not enabled yet; this PDF includes structured chart data so visual chart capture can be added later.',
      ...notes,
    ]),
  };
}

function countByDate(
  orders: AdminOrderApi[],
  dateKey: string,
  predicate: (order: AdminOrderApi) => boolean,
): number {
  return orders.filter((order) => toDateKey(order.orderDate) === dateKey && predicate(order)).length;
}

function paymentState(order: AdminOrderApi): { label: string; tone: AdminBadgeTone } {
  if (order.payment?.status === 'APPROVED') {
    return { label: 'Paid', tone: 'success' };
  }
  if (order.status === 'PAID') {
    return { label: 'Paid', tone: 'success' };
  }
  return { label: 'Pending', tone: 'warning' };
}

function deliveryState(order: AdminOrderApi): { label: string; tone: AdminBadgeTone } {
  switch (order.deliveryOrder?.status) {
    case 'OUT_FOR_SHIPMENT':
      return { label: 'Shipped', tone: 'info' };
    case 'DELIVERED':
      return { label: 'Delivered', tone: 'success' };
    case 'CANCELLED':
      return { label: 'Cancelled', tone: 'danger' };
    case 'PENDING':
      return { label: 'Processing', tone: 'warning' };
    default:
      return order.status === 'PAID'
        ? { label: 'Processing', tone: 'warning' }
        : { label: 'Pending', tone: 'warning' };
  }
}

function productStatus(stock: number): { label: string; tone: AdminBadgeTone } {
  if (stock <= 0) {
    return { label: 'Draft', tone: 'neutral' };
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return { label: 'Low Stock', tone: 'danger' };
  }
  return { label: 'Active', tone: 'success' };
}

function buildPresentationOptions(products: AdminProductApi[]): AdminSelectOption[] {
  const ids = new Set(
    products
      .map((product) => toNullableNumber(product.presentationId))
      .filter((value): value is number => value !== null),
  );
  return Array.from(ids)
    .sort((left, right) => left - right)
    .map((id) => ({ value: id, label: presentationLabel(id) }));
}

function buildProductionOptions(production: AdminProductionApi[]): AdminSelectOption[] {
  return production.map((record) => ({
    value: Number(record.id),
    label: `${record.varietyName} - ${record.collectionDate}`,
  }));
}

function presentationLabel(id: number | null): string {
  switch (id) {
    case 1:
      return 'Bag 340g';
    case 2:
      return 'Capsules';
    case 3:
      return 'Equipment';
    case 4:
      return 'Blend';
    default:
      return id ? `Presentation #${id}` : 'N/A';
  }
}

function latestMetric(
  metrics: AdminEnvironmentMetricApi[],
  type: string,
): AdminEnvironmentMetricApi | null {
  return metrics
    .filter((metric) => metric.metricType.toLowerCase() === type.toLowerCase())
    .sort((left, right) => new Date(right.measuredAt).getTime() - new Date(left.measuredAt).getTime())[0] ?? null;
}

function metric(label: string, value: string, change?: string, tone?: AdminBadgeTone): AdminMetric {
  return { label, value, change, tone };
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toNullableNumber(value: number | string | null | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrency(value: number): string {
  return Math.abs(value) >= 100000
    ? compactCurrencyFormatter.format(value)
    : currencyFormatter.format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatShortDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : shortDateFormatter.format(date);
}

function toDateKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function rangeStatus(
  value: number | string | null | undefined,
  min: number,
  max: number,
  labels: {
    optimalLabel: string;
    lowLabel: string;
    highLabel: string;
  },
): {
  label: string;
  tone: AdminBadgeTone;
} {
  if (value === null || value === undefined || value === '') {
    return { label: 'N/A', tone: 'neutral' };
  }

  const numericValue = toNumber(value);
  if (numericValue < min) {
    return { label: labels.lowLabel, tone: 'warning' };
  }

  if (numericValue > max) {
    return { label: labels.highLabel, tone: 'danger' };
  }

  return { label: labels.optimalLabel, tone: 'success' };
}

function upperBoundStatus(
  value: number | string | null | undefined,
  max: number,
  labels: {
    optimalLabel: string;
    highLabel: string;
  },
): {
  label: string;
  tone: AdminBadgeTone;
} {
  if (value === null || value === undefined || value === '') {
    return { label: 'N/A', tone: 'neutral' };
  }

  const numericValue = toNumber(value);
  if (numericValue > max) {
    return { label: labels.highLabel, tone: 'danger' };
  }

  return { label: labels.optimalLabel, tone: 'success' };
}

function uniqueNotes(notes: string[]): string[] {
  return Array.from(new Set(notes.filter((note) => note.trim().length > 0)));
}
