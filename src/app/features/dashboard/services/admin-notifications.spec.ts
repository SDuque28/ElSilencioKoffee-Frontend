import type { AdminSnapshotApi } from '../models/admin-api.model';
import { buildAdminNotifications } from './admin-notifications';

describe('buildAdminNotifications', () => {
  it('builds recent admin notifications from the existing admin snapshot data', () => {
    const snapshot: AdminSnapshotApi = {
      orders: [
        {
          id: 10,
          userId: 1,
          orderDate: '2026-05-08T10:00:00',
          totalAmount: 95,
          status: 'PAID',
          customer: { id: 1, username: 'Camila', email: 'camila@example.com' },
        },
        {
          id: 11,
          userId: 2,
          orderDate: '2026-05-07T12:00:00',
          totalAmount: 35,
          status: 'PENDING',
          customer: { id: 2, username: 'Luis', email: 'luis@example.com' },
        },
      ],
      users: [],
      products: [
        {
          id: 2,
          name: 'House Blend',
          imageUrl: null,
          price: 15,
          presentationId: 1,
          productionId: 1,
          stockQuantity: 4,
        },
        {
          id: 3,
          name: 'Seasonal Capsules',
          imageUrl: null,
          price: 18,
          presentationId: null,
          productionId: 1,
          stockQuantity: 0,
        },
      ],
      inventory: [],
      production: [],
      environmentMetrics: [],
    };

    const notifications = buildAdminNotifications(snapshot, new Set(['order-11']));

    expect(notifications.length).toBeGreaterThanOrEqual(4);
    expect(notifications.map((notification) => notification.category)).toEqual(
      expect.arrayContaining(['order', 'inventory', 'product', 'sales']),
    );
    expect(notifications.find((notification) => notification.id === 'order-11')?.unread).toBe(false);
    expect(notifications[0]?.createdAt >= notifications[1]?.createdAt).toBe(true);
  });
});
