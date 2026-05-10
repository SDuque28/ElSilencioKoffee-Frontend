import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardProductsPageComponent } from './dashboard-products-page.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminDashboardReportService } from '../services/admin-dashboard-report.service';
import { AdminDataService } from '../services/admin-data.service';

describe('DashboardProductsPageComponent', () => {
  it('filters products by price range and resets active filters', async () => {
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
      imports: [DashboardProductsPageComponent],
      providers: [
        {
          provide: AdminDataService,
          useValue: {
            getSnapshot: () =>
              of({
                success: true,
                data: {
                  orders: [],
                  users: [],
                  products: [
                    {
                      id: 1,
                      name: 'Starter Blend',
                      imageUrl: null,
                      price: 18,
                      presentationId: 1,
                      productionId: 1,
                      stockQuantity: 20,
                    },
                    {
                      id: 2,
                      name: 'Reserve Beans',
                      imageUrl: null,
                      price: 34,
                      presentationId: 1,
                      productionId: 1,
                      stockQuantity: 12,
                    },
                    {
                      id: 3,
                      name: 'Premium Grinder',
                      imageUrl: null,
                      price: 189,
                      presentationId: 3,
                      productionId: 1,
                      stockQuantity: 6,
                    },
                  ],
                  inventory: [],
                  production: [
                    {
                      id: 1,
                      sectionId: 1,
                      sectionName: 'Roastery',
                      sectionLocation: 'Main floor',
                      varietyId: 1,
                      varietyName: 'Geisha',
                      quantityKg: 40,
                      collectionDate: '2026-05-01',
                    },
                  ],
                  environmentMetrics: [],
                },
              }),
          },
        },
        { provide: AdminDashboardReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
      ],
    })
      .overrideComponent(DashboardProductsPageComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardProductsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;

    expect(component.filteredProducts).toHaveLength(3);
    expect(component.hasActiveFilters).toBe(false);

    component.priceRangeFilter = 'UNDER_25';

    expect(component.filteredProducts.map((product) => product.name)).toEqual(['Starter Blend']);
    expect(component.hasActiveFilters).toBe(true);

    component.clearFilters();

    expect(component.priceRangeFilter).toBe('ALL');
    expect(component.hasActiveFilters).toBe(false);
    expect(component.filteredProducts).toHaveLength(3);
    expect(exportCalls).toBe(0);
    expect(toastCalls).toBe(0);
  });

  it('exports the filtered products report', async () => {
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
      imports: [DashboardProductsPageComponent],
      providers: [
        {
          provide: AdminDataService,
          useValue: {
            getSnapshot: () =>
              of({
                success: true,
                data: {
                  orders: [],
                  users: [],
                  products: [
                    {
                      id: 1,
                      name: 'Starter Blend',
                      imageUrl: null,
                      price: 18,
                      presentationId: 1,
                      productionId: 1,
                      stockQuantity: 20,
                    },
                  ],
                  inventory: [],
                  production: [
                    {
                      id: 1,
                      sectionId: 1,
                      sectionName: 'Roastery',
                      sectionLocation: 'Main floor',
                      varietyId: 1,
                      varietyName: 'Geisha',
                      quantityKg: 40,
                      collectionDate: '2026-05-01',
                    },
                  ],
                  environmentMetrics: [],
                },
              }),
          },
        },
        { provide: AdminDashboardReportService, useValue: reportService },
        { provide: ToastService, useValue: toastService },
      ],
    })
      .overrideComponent(DashboardProductsPageComponent, {
        set: {
          imports: [],
          template: '',
        },
      })
      .compileComponents();

    const fixture = TestBed.createComponent(DashboardProductsPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const component = fixture.componentInstance;
    component.priceRangeFilter = 'UNDER_25';

    await component.exportProducts();

    expect(exportedTitle).toBe('Admin Products Report');
    expect(exportedFilterDescription).toContain('Price: Under $25');
    expect(toastCalls).toBe(1);
    expect(component.exporting).toBe(false);
  });
});
