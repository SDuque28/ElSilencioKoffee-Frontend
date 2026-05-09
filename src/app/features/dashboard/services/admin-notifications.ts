import type { AdminSnapshotApi } from '../models/admin-api.model';
import type {
  AdminBadgeTone,
  AdminNotificationCategory,
  AdminNotificationItem,
} from '../models/admin-view.model';

const LOW_STOCK_THRESHOLD = 10;
const MAX_NOTIFICATIONS = 8;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function buildAdminNotifications(
  snapshot: AdminSnapshotApi,
  readIds: ReadonlySet<string> = new Set<string>(),
): AdminNotificationItem[] {
  const notifications = [
    ...buildOrderNotifications(snapshot, readIds),
    ...buildLowStockNotifications(snapshot, readIds),
    ...buildCatalogNotifications(snapshot, readIds),
    ...buildSalesNotifications(snapshot, readIds),
  ];

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, MAX_NOTIFICATIONS);
}

function buildOrderNotifications(
  snapshot: AdminSnapshotApi,
  readIds: ReadonlySet<string>,
): AdminNotificationItem[] {
  return [...snapshot.orders]
    .sort((left, right) => new Date(right.orderDate).getTime() - new Date(left.orderDate).getTime())
    .slice(0, 3)
    .map((order) =>
      notification({
        id: `order-${order.id}`,
        title: `New order ${formatOrderCode(order.id)}`,
        description: `${order.customer?.username ?? `User #${order.userId}`} placed an order for ${formatCurrency(order.totalAmount)}.`,
        category: 'order',
        createdAt: order.orderDate,
        route: '/dashboard/orders',
        tone: order.status === 'PAID' ? 'success' : 'warning',
        readIds,
      }),
    );
}

function buildLowStockNotifications(
  snapshot: AdminSnapshotApi,
  readIds: ReadonlySet<string>,
): AdminNotificationItem[] {
  return snapshot.products
    .filter((product) => toNumber(product.stockQuantity) <= LOW_STOCK_THRESHOLD)
    .sort((left, right) => toNumber(left.stockQuantity) - toNumber(right.stockQuantity))
    .slice(0, 3)
    .map((product) =>
      notification({
        id: `inventory-${product.id}`,
        title: `${product.name} is running low`,
        description: `Only ${toNumber(product.stockQuantity)} units remain in stock.`,
        category: 'inventory',
        createdAt: latestSnapshotDate(snapshot),
        route: '/dashboard/products',
        tone: toNumber(product.stockQuantity) <= 0 ? 'danger' : 'warning',
        readIds,
      }),
    );
}

function buildCatalogNotifications(
  snapshot: AdminSnapshotApi,
  readIds: ReadonlySet<string>,
): AdminNotificationItem[] {
  return snapshot.products
    .filter((product) => !product.presentationId || !product.productionId || toNumber(product.stockQuantity) <= 0)
    .slice(0, 2)
    .map((product) =>
      notification({
        id: `product-${product.id}`,
        title: `Catalog action needed for ${product.name}`,
        description:
          !product.presentationId || !product.productionId
            ? 'This product is missing catalog metadata and should be reviewed.'
            : 'This product is currently unavailable and may need replenishment or status review.',
        category: 'product',
        createdAt: latestSnapshotDate(snapshot),
        route: '/dashboard/products',
        tone: 'info',
        readIds,
      }),
    );
}

function buildSalesNotifications(
  snapshot: AdminSnapshotApi,
  readIds: ReadonlySet<string>,
): AdminNotificationItem[] {
  const paidOrders = snapshot.orders.filter((order) => order.status === 'PAID');
  if (paidOrders.length === 0) {
    return [];
  }

  const latestDateKey = paidOrders
    .map((order) => toDateKey(order.orderDate))
    .filter((value): value is string => value !== null)
    .sort((left, right) => left.localeCompare(right))
    .at(-1);

  if (!latestDateKey) {
    return [];
  }

  const revenue = paidOrders
    .filter((order) => toDateKey(order.orderDate) === latestDateKey)
    .reduce((sum, order) => sum + toNumber(order.totalAmount), 0);

  return [
    notification({
      id: `sales-${latestDateKey}`,
      title: 'Recent sales activity updated',
      description: `${formatCurrency(revenue)} in paid revenue was recorded on ${formatDateKey(latestDateKey)}.`,
      category: 'sales',
      createdAt: `${latestDateKey}T23:59:59`,
      route: '/dashboard/analytics',
      tone: 'success',
      readIds,
    }),
  ];
}

function notification({
  id,
  title,
  description,
  category,
  createdAt,
  route,
  tone,
  readIds,
}: {
  id: string;
  title: string;
  description: string;
  category: AdminNotificationCategory;
  createdAt: string;
  route: string;
  tone: AdminBadgeTone;
  readIds: ReadonlySet<string>;
}): AdminNotificationItem {
  return {
    id,
    title,
    description,
    category,
    createdAt,
    relativeTime: formatRelativeTime(createdAt),
    route,
    tone,
    unread: !readIds.has(id),
  };
}

function latestSnapshotDate(snapshot: AdminSnapshotApi): string {
  const candidates = [
    ...snapshot.orders.map((order) => order.orderDate),
    ...snapshot.production.map((record) => record.collectionDate),
    ...snapshot.environmentMetrics.map((metric) => metric.measuredAt),
  ]
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((left, right) => right.getTime() - left.getTime());

  return candidates[0]?.toISOString() ?? new Date().toISOString();
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Recent';
  }

  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);

  if (minutes < 60) {
    return `${Math.max(minutes, 1)} min ago`;
  }

  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} hr ago`;
  }

  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function formatOrderCode(orderId: string | number): string {
  return `#COF-${String(orderId).padStart(4, '0')}`;
}

function formatCurrency(value: number | string | null | undefined): string {
  return currencyFormatter.format(toNumber(value));
}

function toNumber(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateKey(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

function formatDateKey(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
}
