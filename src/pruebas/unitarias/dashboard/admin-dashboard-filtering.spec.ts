import type { AdminSnapshotApi } from 'app/features/dashboard/models/admin-api.model';
import { buildFilteredAdminSnapshot } from 'app/features/dashboard/services/admin-dashboard-filtering';

describe('admin dashboard filtering', () => {
  it('filters dated dashboard collections to the latest 7 calendar days while preserving undated snapshots', () => {
    const snapshot: AdminSnapshotApi = {
      orders: Array.from({ length: 8 }, (_, index) => ({
        id: index + 1,
        userId: index < 4 ? 10 : 11,
        orderDate: `2026-05-0${index + 1}T10:00:00`,
        totalAmount: 100 + index,
        status: index % 2 === 0 ? 'PAID' : 'PENDING',
      })),
      users: [
        { id: 10, username: 'Camila', email: 'camila@example.com', activo: true, createdAt: '2026-05-01T08:00:00' },
        { id: 11, username: 'Luis', email: 'luis@example.com', activo: true, createdAt: '2026-05-01T08:00:00' },
      ],
      products: [
        { id: 1, name: 'Blend', imageUrl: null, price: 18, presentationId: 1, productionId: 1, stockQuantity: 4 },
      ],
      inventory: [
        { id: 1, productId: 1, productName: 'Blend', productImageUrl: null, stockQuantity: 4 },
      ],
      production: [
        {
          id: 1,
          sectionId: 1,
          sectionName: 'North',
          sectionLocation: 'Hill',
          varietyId: 1,
          varietyName: 'Caturra',
          quantityKg: 20,
          collectionDate: '2026-05-08T06:30:00',
        },
        {
          id: 2,
          sectionId: 1,
          sectionName: 'North',
          sectionLocation: 'Hill',
          varietyId: 1,
          varietyName: 'Caturra',
          quantityKg: 18,
          collectionDate: '2026-04-25T06:30:00',
        },
      ],
      environmentMetrics: [
        {
          id: 1,
          metricType: 'temperature',
          value: 22,
          unit: 'C',
          measuredAt: '2026-05-08T09:00:00',
        },
        {
          id: 2,
          metricType: 'humidity',
          value: 61,
          unit: '%',
          measuredAt: '2026-04-28T09:00:00',
        },
      ],
    };

    const result = buildFilteredAdminSnapshot(snapshot, 'last-7-days');

    expect(result.filter.label).toBe('Last 7 Days');
    expect(result.filter.rangeStart).toBe('2026-05-02');
    expect(result.filter.rangeEnd).toBe('2026-05-08');
    expect(result.snapshot.orders.map((order) => order.id)).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(result.snapshot.environmentMetrics.map((metric) => metric.id)).toEqual([1]);
    expect(result.snapshot.production.map((record) => record.id)).toEqual([1]);
    expect(result.snapshot.products).toHaveLength(1);
    expect(result.snapshot.inventory).toHaveLength(1);
    expect(result.notes).toEqual([
      'Products and inventory remain on the current backend snapshot because their API models do not expose date fields.',
    ]);
  });
});
