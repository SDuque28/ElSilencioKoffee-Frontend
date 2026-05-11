import type {
  AdminSnapshotApi,
} from '../models/admin-api.model';
import type {
  AdminDashboardDateFilterKey,
  AdminDashboardDateFilterState,
} from '../models/admin-view.model';

const fullDateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
});

export interface AdminFilteredSnapshotResult {
  snapshot: AdminSnapshotApi;
  filter: AdminDashboardDateFilterState;
  notes: string[];
}

export function buildFilteredAdminSnapshot(
  snapshot: AdminSnapshotApi,
  filterKey: AdminDashboardDateFilterKey,
): AdminFilteredSnapshotResult {
  const filter = buildAdminDashboardDateFilterState(filterKey, resolveReferenceDate(snapshot));

  if (!filter.isRangeFiltered) {
    return {
      snapshot,
      filter,
      notes: [],
    };
  }

  return {
    snapshot: {
      orders: snapshot.orders.filter((order) => isWithinRange(order.orderDate, filter)),
      users: snapshot.users,
      products: snapshot.products,
      inventory: snapshot.inventory,
      production: snapshot.production.filter((record) =>
        isWithinRange(record.collectionDate, filter),
      ),
      environmentMetrics: snapshot.environmentMetrics.filter((metric) =>
        isWithinRange(metric.measuredAt, filter),
      ),
    },
    filter,
    notes: [
      'Products and inventory remain on the current backend snapshot because their API models do not expose date fields.',
    ],
  };
}

export function buildAdminDashboardDateFilterState(
  key: AdminDashboardDateFilterKey,
  referenceDate: Date,
): AdminDashboardDateFilterState {
  if (key === 'last-7-days') {
    const end = endOfDay(referenceDate);
    const start = startOfDay(addDays(end, -6));

    return {
      key,
      label: 'Last 7 Days',
      description: `${fullDateFormatter.format(start)} - ${fullDateFormatter.format(end)}`,
      isRangeFiltered: true,
      rangeStart: toIsoDate(start),
      rangeEnd: toIsoDate(end),
    };
  }

  return {
    key,
    label: 'All Time',
    description: 'All available dashboard data',
    isRangeFiltered: false,
    rangeStart: null,
    rangeEnd: null,
  };
}

function resolveReferenceDate(snapshot: AdminSnapshotApi): Date {
  const candidates = [
    ...snapshot.orders.map((order) => parseDate(order.orderDate)),
    ...snapshot.environmentMetrics.map((metric) => parseDate(metric.measuredAt)),
    ...snapshot.production.map((record) => parseDate(record.collectionDate)),
  ].filter((value): value is Date => value !== null);

  if (candidates.length === 0) {
    return new Date();
  }

  return new Date(Math.max(...candidates.map((value) => value.getTime())));
}

function isWithinRange(value: string, filter: AdminDashboardDateFilterState): boolean {
  if (!filter.isRangeFiltered || !filter.rangeStart || !filter.rangeEnd) {
    return true;
  }

  const parsed = parseDate(value);
  if (!parsed) {
    return false;
  }

  const timestamp = parsed.getTime();
  const start = parseDate(filter.rangeStart)?.getTime() ?? Number.NEGATIVE_INFINITY;
  const end = endOfDay(parseDate(filter.rangeEnd) ?? parsed).getTime();

  return timestamp >= start && timestamp <= end;
}

function parseDate(value: string): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    return new Date(Number(year), Number(month) - 1, Number(day), 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function endOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999);
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function toIsoDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
