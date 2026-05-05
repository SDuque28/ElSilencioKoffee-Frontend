import type {
  ChartSeries,
  DashboardMetric,
  DashboardOverview,
  SalesMetric,
  TopBuyer,
} from '../../../core/models/dashboard.model';

export interface DashboardOrderApiResponse {
  id: number | string;
  orderDate: string | null;
  status: string | null;
  totalAmount: number | string | null;
  userId: number | string | null;
}

export interface DashboardOrdersPageApiResponse {
  content?: DashboardOrderApiResponse[] | null;
}

export interface DashboardUserApiResponse {
  activo?: boolean | null;
  createdAt?: string | null;
  email?: string | null;
  id: number | string;
  username?: string | null;
}

export interface DashboardUsersPageApiResponse {
  content?: DashboardUserApiResponse[] | null;
}

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

const CARD_NUMBER_FORMATTER = new Intl.NumberFormat('es-CO', {
  maximumFractionDigits: 0,
});

const CARD_CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
});

export function normalizeOrdersResponse(
  response: DashboardOrderApiResponse[] | DashboardOrdersPageApiResponse,
): DashboardOrderApiResponse[] {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response.content) ? response.content : [];
}

export function normalizeUsersResponse(
  response: DashboardUserApiResponse[] | DashboardUsersPageApiResponse,
): DashboardUserApiResponse[] {
  if (Array.isArray(response)) {
    return response;
  }

  return Array.isArray(response.content) ? response.content : [];
}

export function createDefaultDashboardDateRange(now = new Date()): DashboardDateRange {
  const endDate = toDateOnly(now);
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - 29);

  return {
    startDate: toDateOnly(startDate),
    endDate,
  };
}

export function buildDashboardOverview(
  orders: DashboardOrderApiResponse[],
  range: DashboardDateRange,
): DashboardOverview {
  const filteredOrders = filterOrdersByDateRange(orders, range);
  const revenueSeries = buildRevenueSeries(filteredOrders, range);
  const metrics = buildMetrics(filteredOrders);

  return {
    metrics,
    revenueSeries: toChartSeries(revenueSeries),
  };
}

export function buildOrderVolumeSeries(
  orders: DashboardOrderApiResponse[],
  range: DashboardDateRange,
): ChartSeries {
  const filteredOrders = filterOrdersByDateRange(orders, range);

  if (filteredOrders.length === 0) {
    return {
      labels: [],
      values: [],
    };
  }

  const weeklyCounts = new Map<string, number>();

  for (const order of filteredOrders) {
    const parsedDate = parseDate(order.orderDate);
    if (!parsedDate) {
      continue;
    }

    const weekKey = getWeekStartKey(parsedDate);
    weeklyCounts.set(weekKey, (weeklyCounts.get(weekKey) ?? 0) + 1);
  }

  const metrics = Array.from(weeklyCounts.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([weekKey, count]) => ({
      label: formatDateLabel(weekKey),
      value: count,
    }));

  return toChartSeries(metrics);
}

export function buildTopBuyers(
  orders: DashboardOrderApiResponse[],
  users: DashboardUserApiResponse[],
  limit = 10,
): TopBuyer[] {
  const usersById = new Map(
    users.map((user) => [String(user.id), user.username?.trim() || `User #${user.id}`]),
  );
  const buyersById = new Map<
    string,
    {
      name: string;
      purchases: number;
      totalSpend: number;
    }
  >();

  for (const order of orders) {
    if (order.userId === null || order.userId === undefined) {
      continue;
    }

    const userId = String(order.userId);
    const buyer = buyersById.get(userId) ?? {
      name: usersById.get(userId) ?? `User #${userId}`,
      purchases: 0,
      totalSpend: 0,
    };

    buyer.purchases += 1;
    buyer.totalSpend += coerceNumber(order.totalAmount);
    buyersById.set(userId, buyer);
  }

  return Array.from(buyersById.values())
    .sort((left, right) => {
      if (right.totalSpend !== left.totalSpend) {
        return right.totalSpend - left.totalSpend;
      }

      return right.purchases - left.purchases;
    })
    .slice(0, limit)
    .map((buyer) => ({
      name: buyer.name,
      purchases: buyer.purchases,
      totalSpend: roundToTwoDecimals(buyer.totalSpend),
    }));
}

function buildMetrics(orders: DashboardOrderApiResponse[]): DashboardMetric[] {
  const totalRevenue = orders.reduce((sum, order) => sum + coerceNumber(order.totalAmount), 0);
  const customers = new Set(
    orders
      .map((order) => order.userId)
      .filter((userId): userId is string | number => userId !== null && userId !== undefined)
      .map((userId) => String(userId)),
  );

  return [
    {
      label: 'Orders (30d)',
      value: CARD_NUMBER_FORMATTER.format(orders.length),
    },
    {
      label: 'Revenue (30d)',
      value: CARD_CURRENCY_FORMATTER.format(totalRevenue),
    },
    {
      label: 'Customers (30d)',
      value: CARD_NUMBER_FORMATTER.format(customers.size),
    },
  ];
}

function buildRevenueSeries(
  orders: DashboardOrderApiResponse[],
  range: DashboardDateRange,
): SalesMetric[] {
  if (orders.length === 0) {
    return [];
  }

  const totalsByDay = new Map<string, number>();

  for (const dateKey of getDateKeysInRange(range)) {
    totalsByDay.set(dateKey, 0);
  }

  for (const order of orders) {
    const parsedDate = parseDate(order.orderDate);
    if (!parsedDate) {
      continue;
    }

    const dateKey = toDateOnly(parsedDate);
    totalsByDay.set(dateKey, (totalsByDay.get(dateKey) ?? 0) + coerceNumber(order.totalAmount));
  }

  return Array.from(totalsByDay.entries()).map(([dateKey, total]) => ({
    label: formatDateLabel(dateKey),
    value: roundToTwoDecimals(total),
  }));
}

function toChartSeries(metrics: SalesMetric[]): ChartSeries {
  return {
    labels: metrics.map((metric) => metric.label),
    values: metrics.map((metric) => metric.value),
  };
}

function filterOrdersByDateRange(
  orders: DashboardOrderApiResponse[],
  range: DashboardDateRange,
): DashboardOrderApiResponse[] {
  const start = parseDate(`${range.startDate}T00:00:00`);
  const end = parseDate(`${range.endDate}T23:59:59`);

  if (!start || !end) {
    return [];
  }

  return orders
    .filter((order) => {
      const parsedDate = parseDate(order.orderDate);
      return parsedDate !== null && parsedDate >= start && parsedDate <= end;
    })
    .sort((left, right) => {
      const leftDate = parseDate(left.orderDate);
      const rightDate = parseDate(right.orderDate);

      if (!leftDate || !rightDate) {
        return 0;
      }

      return leftDate.getTime() - rightDate.getTime();
    });
}

function getDateKeysInRange(range: DashboardDateRange): string[] {
  const start = parseDate(`${range.startDate}T00:00:00`);
  const end = parseDate(`${range.endDate}T00:00:00`);

  if (!start || !end || start > end) {
    return [];
  }

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    dates.push(toDateOnly(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function getWeekStartKey(value: Date): string {
  const date = new Date(value);
  const dayOfWeek = date.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  date.setDate(date.getDate() + diff);

  return toDateOnly(date);
}

function formatDateLabel(value: string): string {
  const parsedDate = parseDate(`${value}T00:00:00`);

  if (!parsedDate) {
    return value;
  }

  return DAY_LABEL_FORMATTER.format(parsedDate);
}

function toDateOnly(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function parseDate(value: string | null): Date | null {
  if (!value) {
    return null;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function coerceNumber(value: number | string | null): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  return 0;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}
