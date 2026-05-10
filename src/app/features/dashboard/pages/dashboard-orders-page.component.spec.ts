import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DashboardOrdersPageComponent } from './dashboard-orders-page.component';
import { AdminDashboardReportService } from '../services/admin-dashboard-report.service';
import { AdminDataService } from '../services/admin-data.service';

describe('DashboardOrdersPageComponent', () => {
  it('filters orders to the latest 30-day window', async () => {
    let exportCalls = 0;
    let toastCalls = 0;
    const reportService = {
      exportReport: async () => {
        exportCalls += 1;
      },
    };
    const toastService = {
      show: () => {
        toastCalls += 1;
      },
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOrdersPageComponent],
      providers: [
        {
          provide: AdminDataService,
          useValue: {
            listAdminOrders: () =>
              of({
                success: true,
                data: [
                  {
                    id: 11,
                    userId: 1,
                    totalAmount: 34,
                    status: 'PAID',
                    orderDate: '2026-05-09',
                    customer: { username: 'jhon', email: 'jhon@email.com' },
                    items: [],
                    payment: { status: 'APPROVED' },
                    deliveryOrder: { status: 'OUT_FOR_SHIPMENT' },
                    shippingInformation: null,
                  },
                  {
                    id: 10,
                    userId: 2,
                    totalAmount: 62,
                    status: 'PENDING',
                    orderDate: '2026-04-13',
                    customer: { username: 'pablo', email: 'pablo@email.com' },
                    items: [],
                    payment: null,
                    deliveryOrder: { status: 'PENDING' },
                    shippingInformation: null,
                  },
                  {
                    id: 9,
                    userId: 3,
                    totalAmount: 110,
                    status: 'PAID',
                    orderDate: '2026-03-05',
                    customer: { username: 'maria', email: 'maria@email.com' },
                    items: [],
                    payment: { status: 'APPROVED' },
                    deliveryOrder: { status: 'DELIVERED' },
                    shippingInformation: null,
                  },
                ],
              }),
            getAdminOrder: () => of({ success: false, error: 'Not needed in this spec' }),
            updateOrderStatus: () => of({ success: false, error: 'Not needed in this spec' }),
          },
        },
        { provide: AdminDashboardReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
      ],
    })
      .overrideComponent(DashboardOrdersPageComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardOrdersPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    expect(component.filteredRows.map((row) => row.orderCode)).toEqual([
      '#COF-0011',
      '#COF-0010',
      '#COF-0009',
    ]);

    component.toggleLast30DaysFilter();

    expect(component.filteredRows.map((row) => row.orderCode)).toEqual([
      '#COF-0011',
      '#COF-0010',
    ]);
    expect(component.displayMetrics[1].value).toBe('2 Orders');
    expect(exportCalls).toBe(0);
    expect(toastCalls).toBe(0);
  });

  it('exports the filtered orders report', async () => {
    let exportedTitle = '';
    let exportedFilterDescription = '';
    let toastCalls = 0;
    const reportService = {
      exportReport: async (report: unknown) => {
        const exportedReport = report as {
          title: string;
          filterDescription: string;
        };
        exportedTitle = exportedReport.title;
        exportedFilterDescription = exportedReport.filterDescription;
      },
    };
    const toastService = {
      show: (_toast: unknown) => {
        toastCalls += 1;
      },
    };

    await TestBed.configureTestingModule({
      imports: [DashboardOrdersPageComponent],
      providers: [
        {
          provide: AdminDataService,
          useValue: {
            listAdminOrders: () =>
              of({
                success: true,
                data: [
                  {
                    id: 11,
                    userId: 1,
                    totalAmount: 34,
                    status: 'PAID',
                    orderDate: '2026-05-09',
                    customer: { username: 'jhon', email: 'jhon@email.com' },
                    items: [],
                    payment: { status: 'APPROVED' },
                    deliveryOrder: { status: 'OUT_FOR_SHIPMENT' },
                    shippingInformation: null,
                  },
                ],
              }),
            getAdminOrder: () => of({ success: false, error: 'Not needed in this spec' }),
            updateOrderStatus: () => of({ success: false, error: 'Not needed in this spec' }),
          },
        },
        { provide: AdminDashboardReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
      ],
    })
      .overrideComponent(DashboardOrdersPageComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardOrdersPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.toggleLast30DaysFilter();

    await component.exportOrders();

    expect(exportedTitle).toBe('Admin Orders Report');
    expect(exportedFilterDescription).toContain('Date: Last 30 Days');
    expect(toastCalls).toBe(1);
    expect(component.exporting).toBe(false);
  });
});
