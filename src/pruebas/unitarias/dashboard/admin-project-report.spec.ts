import type { AdminSnapshotApi } from 'app/features/dashboard/models/admin-api.model';
import { buildCompleteAdminProjectReport } from 'app/features/dashboard/services/admin-project-report';

describe('buildCompleteAdminProjectReport', () => {
  it('builds a complete admin project report with multi-section summaries', () => {
    const snapshot: AdminSnapshotApi = {
      orders: [
        {
          id: 1,
          userId: 10,
          orderDate: '2026-05-08T10:00:00',
          totalAmount: 120,
          status: 'PAID',
          customer: { id: 10, username: 'Camila', email: 'camila@example.com' },
        },
      ],
      users: [
        {
          id: 10,
          username: 'Camila',
          email: 'camila@example.com',
          activo: true,
          createdAt: '2026-05-01T08:00:00',
        },
      ],
      products: [
        {
          id: 1,
          name: 'House Blend',
          imageUrl: null,
          price: 18,
          presentationId: 1,
          productionId: 1,
          stockQuantity: 8,
        },
      ],
      inventory: [
        {
          id: 1,
          productId: 1,
          productName: 'House Blend',
          productImageUrl: null,
          stockQuantity: 8,
        },
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
          collectionDate: '2026-05-06',
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
      ],
    };

    const report = buildCompleteAdminProjectReport(snapshot, new Map([['10', 'ADMIN']]), {
      activeFilterLabel: 'Last 7 Days',
      activeFilterDescription: 'May 02, 2026 - May 08, 2026',
    });

    expect(report.title).toBe('El Silencio Koffee - Complete Admin Project Report');
    expect(report.metrics.length).toBeGreaterThan(0);
    expect(report.sections?.map((section) => section.title)).toEqual(
      expect.arrayContaining([
        'General Dashboard KPIs',
        'Orders & Purchases Summary',
        'Sales & Revenue Summary',
        'Products Summary',
        'Inventory & Stock Summary',
        'Users & Accounts Summary',
        'Quotes & Approvals Summary',
      ]),
    );
    expect(report.sections?.find((section) => section.title === 'Quotes & Approvals Summary')?.availabilityMessage).toContain(
      'Data not available',
    );
    expect(report.notes[0]).toContain('Last 7 Days');
  });
});
