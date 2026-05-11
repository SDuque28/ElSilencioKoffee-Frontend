import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DashboardHomePageComponent } from './dashboard-home-page.component';
import { AdminDataService } from '../services/admin-data.service';
import { AdminProjectReportService } from '../services/admin-project-report.service';

describe('DashboardHomePageComponent', () => {
  const snapshotResponse = {
    success: true as const,
    data: {
      orders: [
        {
          id: 1,
          userId: 10,
          orderDate: '2026-05-01T10:00:00',
          totalAmount: 80,
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
          orderDate: '2026-05-06T10:00:00',
          totalAmount: 65,
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
      ],
      products: [
        { id: 1, name: 'Blend', imageUrl: null, price: 18, presentationId: 1, productionId: 1, stockQuantity: 4 },
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
    },
    message: 'ok',
  } satisfies ApiResponse<unknown>;

  it('toggles the last 7 days filter and exports the filtered report payload', async () => {
    const reportService = {
      exportCompleteProjectReport: vi.fn().mockResolvedValue(undefined),
    };
    const router = {
      navigateByUrl: vi.fn().mockResolvedValue(true),
    };
    const toastService = {
      show: vi.fn(),
      messages: signal<unknown[]>([]),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardHomePageComponent],
      providers: [
        {
          provide: AdminDataService,
          useValue: {
            getSnapshot: () => of(snapshotResponse),
          },
        },
        {
          provide: AdminProjectReportService,
          useValue: reportService,
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    })
      .overrideComponent(DashboardHomePageComponent, {
        set: {
          imports: [],
          template: `
            <button data-cy="dashboard-home-last-7-days" type="button" (click)="toggleLast7DaysFilter()">
              Last 7 Days
            </button>
            <button data-cy="dashboard-home-export-report" type="button" (click)="exportResults()">
              Export
            </button>
            <button data-cy="dashboard-home-view-all-orders" type="button" (click)="viewAllOrders()">
              View All Orders
            </button>
            <div data-cy="dashboard-home-active-filter">{{ overview?.activeFilter?.label }}</div>
            <div data-cy="dashboard-home-order-metric">{{ overview?.metrics?.[1]?.label }}</div>
          `,
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardHomePageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const filterButton = nativeElement.querySelector(
      '[data-cy="dashboard-home-last-7-days"]',
    ) as HTMLButtonElement;
    const exportButton = nativeElement.querySelector(
      '[data-cy="dashboard-home-export-report"]',
    ) as HTMLButtonElement;
    const viewAllOrdersButton = nativeElement.querySelector(
      '[data-cy="dashboard-home-view-all-orders"]',
    ) as HTMLButtonElement;

    expect(
      nativeElement.querySelector('[data-cy="dashboard-home-active-filter"]')?.textContent,
    ).toContain('All Time');

    filterButton.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.componentInstance.overview?.activeFilter.key).toBe('last-7-days');
    expect(
      nativeElement.querySelector('[data-cy="dashboard-home-active-filter"]')?.textContent,
    ).toContain('Last 7 Days');
    expect(
      nativeElement.querySelector('[data-cy="dashboard-home-order-metric"]')?.textContent,
    ).toContain('Orders in Range');

    exportButton.click();
    await fixture.whenStable();

    expect(reportService.exportCompleteProjectReport).toHaveBeenCalledTimes(1);
    const exportCall = reportService.exportCompleteProjectReport.mock.calls[0]?.[0] as
      | { activeFilter?: { label?: string | null } | null }
      | undefined;
    expect(exportCall?.activeFilter?.label).toBe('Last 7 Days');
    expect(toastService.show).toHaveBeenCalled();

    viewAllOrdersButton.click();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/dashboard/orders');
  });
});
