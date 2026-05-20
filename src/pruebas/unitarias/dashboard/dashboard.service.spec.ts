import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import type { ApiResponse } from 'app/core/models/api-response.model';
import { ApiService } from 'app/core/services/api.service';
import { DashboardService } from 'app/features/dashboard/services/dashboard.service';

describe('DashboardService', () => {
  let service: DashboardService;
  let apiService: { get: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    apiService = {
      get: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        {
          provide: ApiService,
          useValue: apiService,
        },
      ],
    });

    service = TestBed.inject(DashboardService);
  });

  it('builds overview metrics and revenue series from the real orders endpoint', async () => {
    apiService.get.mockReturnValueOnce(
      of({
        success: true,
        data: [
          {
            id: 1,
            userId: 10,
            orderDate: '2026-04-02T10:00:00',
            totalAmount: 120000,
            status: 'NON PAID',
          },
          {
            id: 2,
            userId: 11,
            orderDate: '2026-04-03T12:30:00',
            totalAmount: 80000,
            status: 'PAID',
          },
          {
            id: 3,
            userId: 10,
            orderDate: '2026-04-03T14:15:00',
            totalAmount: 40000,
            status: 'PAID',
          },
        ],
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const result = await firstValueFrom(service.getOverview('2026-04-01', '2026-04-05'));

    expect(apiService.get).toHaveBeenCalledWith('orders', {
      baseUrl: '/api-auth',
    });
    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected a success response.');
    }

    expect(result.data.metrics).toEqual([
      { label: 'Orders (30d)', value: '3' },
      { label: 'Revenue (30d)', value: '$ 240.000' },
      { label: 'Customers (30d)', value: '2' },
    ]);
    expect(result.data.revenueSeries).toEqual({
      labels: ['Apr 1', 'Apr 2', 'Apr 3', 'Apr 4', 'Apr 5'],
      values: [0, 120000, 120000, 0, 0],
    });
  });

  it('builds weekly order volume from the real orders endpoint', async () => {
    apiService.get.mockReturnValueOnce(
      of({
        success: true,
        data: [
          {
            id: 1,
            userId: 10,
            orderDate: '2026-04-01T10:00:00',
            totalAmount: 120000,
            status: 'NON PAID',
          },
          {
            id: 2,
            userId: 11,
            orderDate: '2026-04-07T12:30:00',
            totalAmount: 80000,
            status: 'PAID',
          },
          {
            id: 3,
            userId: 12,
            orderDate: '2026-04-09T14:15:00',
            totalAmount: 40000,
            status: 'PAID',
          },
        ],
        message: 'ok',
      } satisfies ApiResponse<unknown>),
    );

    const result = await firstValueFrom(service.getOrderVolumeSeries('2026-04-01', '2026-04-15'));

    expect(apiService.get).toHaveBeenCalledWith('orders', {
      baseUrl: '/api-auth',
    });
    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected a success response.');
    }

    expect(result.data).toEqual({
      labels: ['Mar 30', 'Apr 6'],
      values: [1, 2],
    });
  });

  it('builds top buyers from real orders and users endpoints', async () => {
    apiService.get
      .mockReturnValueOnce(
        of({
          success: true,
          data: [
            {
              id: 1,
              userId: 10,
              orderDate: '2026-04-02T10:00:00',
              totalAmount: 120000,
              status: 'NON PAID',
            },
            {
              id: 2,
              userId: 11,
              orderDate: '2026-04-03T12:30:00',
              totalAmount: 180000,
              status: 'PAID',
            },
            {
              id: 3,
              userId: 10,
              orderDate: '2026-04-04T14:15:00',
              totalAmount: 80000,
              status: 'PAID',
            },
          ],
          message: 'ok',
        } satisfies ApiResponse<unknown>),
      )
      .mockReturnValueOnce(
        of({
          success: true,
          data: [
            {
              id: 10,
              username: 'Camila Perez',
              email: 'camila@example.com',
              activo: true,
              createdAt: '2026-04-01T08:00:00',
            },
            {
              id: 11,
              username: 'Luis Rojas',
              email: 'luis@example.com',
              activo: true,
              createdAt: '2026-04-01T08:00:00',
            },
          ],
          message: 'ok',
        } satisfies ApiResponse<unknown>),
      );

    const result = await firstValueFrom(service.getTopBuyers());

    expect(apiService.get).toHaveBeenNthCalledWith(1, 'orders', {
      baseUrl: '/api-auth',
    });
    expect(apiService.get).toHaveBeenNthCalledWith(2, 'users', {
      baseUrl: '/api-auth',
    });
    expect(result.success).toBe(true);

    if (!result.success) {
      throw new Error('Expected a success response.');
    }

    expect(result.data).toEqual([
      { name: 'Camila Perez', purchases: 2, totalSpend: 200000 },
      { name: 'Luis Rojas', purchases: 1, totalSpend: 180000 },
    ]);
  });
});
