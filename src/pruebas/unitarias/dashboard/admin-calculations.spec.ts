import type { AdminSnapshotApi } from 'app/features/dashboard/models/admin-api.model';
import { buildOverview } from 'app/features/dashboard/services/admin-calculations';
import { buildFilteredAdminSnapshot } from 'app/features/dashboard/services/admin-dashboard-filtering';

describe('buildOverview', () => {
  it('builds a filtered overview and report payload from the same dashboard data', () => {
    const snapshot: AdminSnapshotApi = {
      orders: [
        {
          id: 1,
          userId: 10,
          orderDate: '2026-05-01T10:00:00',
          totalAmount: 90,
          status: 'PAID',
          customer: { id: 10, username: 'Camila', email: 'camila@example.com' },
        },
        {
          id: 2,
          userId: 10,
          orderDate: '2026-05-03T10:00:00',
          totalAmount: 120,
          status: 'PAID',
          customer: { id: 10, username: 'Camila', email: 'camila@example.com' },
        },
        {
          id: 3,
          userId: 11,
          orderDate: '2026-05-07T10:00:00',
          totalAmount: 70,
          status: 'PENDING',
          customer: { id: 11, username: 'Luis', email: 'luis@example.com' },
        },
        {
          id: 4,
          userId: 11,
          orderDate: '2026-05-08T10:00:00',
          totalAmount: 150,
          status: 'PAID',
          customer: { id: 11, username: 'Luis', email: 'luis@example.com' },
        },
      ],
      users: [
        { id: 10, username: 'Camila', email: 'camila@example.com', activo: true, createdAt: '2026-04-01T08:00:00' },
        { id: 11, username: 'Luis', email: 'luis@example.com', activo: true, createdAt: '2026-04-01T08:00:00' },
        { id: 12, username: 'Sara', email: 'sara@example.com', activo: false, createdAt: '2026-04-01T08:00:00' },
      ],
      products: [
        { id: 1, name: 'Blend', imageUrl: null, price: 18, presentationId: 1, productionId: 1, stockQuantity: 4 },
        { id: 2, name: 'Capsules', imageUrl: null, price: 12, presentationId: 2, productionId: 1, stockQuantity: 22 },
      ],
      inventory: [],
      production: [],
      environmentMetrics: [
        {
          id: 1,
          metricType: 'temperature',
          value: 22,
          unit: 'C',
          measuredAt: '2026-05-08T09:00:00',
        },
      ],
    };

    const filteredSnapshot = buildFilteredAdminSnapshot(snapshot, 'last-7-days');
    const overview = buildOverview(filteredSnapshot.snapshot, {
      filter: filteredSnapshot.filter,
      notes: filteredSnapshot.notes,
    });

    expect(overview.activeFilter.key).toBe('last-7-days');
    expect(overview.metrics).toEqual([
      {
        label: 'Total Sales',
        value: '$270.00',
        change: 'May 02, 2026 - May 08, 2026',
        tone: 'success',
      },
      {
        label: 'Orders in Range',
        value: '3',
        change: 'Last 7 Days',
        tone: 'success',
      },
      {
        label: 'Active Users',
        value: '2',
        change: 'Users with orders in the active range',
        tone: 'info',
      },
      {
        label: 'Low Stock',
        value: '1 Items',
        change: 'Inventory snapshot',
        tone: 'warning',
      },
    ]);
    expect(overview.revenueSeries).toEqual({
      labels: ['May 03', 'May 08'],
      values: [120, 150],
    });
    expect(overview.report.title).toBe('Admin Dashboard Report');
    expect(overview.report.filterLabel).toBe('Last 7 Days');
    expect(overview.report.chartSummaries[0]?.summary).toEqual([
      { label: 'Date points', value: '2' },
      { label: 'Filtered orders', value: '3' },
      { label: 'Filtered paid revenue', value: '$270.00' },
      { label: 'Peak revenue date', value: 'May 08 ($150.00)' },
    ]);
    expect(overview.report.tables[1]?.rows).toHaveLength(3);
    expect(overview.report.notes).toContain(
      'Chart image export is not enabled yet; this PDF includes structured chart data so visual chart capture can be added later.',
    );
  });
});
