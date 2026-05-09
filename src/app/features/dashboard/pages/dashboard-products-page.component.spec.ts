import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { DashboardProductsPageComponent } from './dashboard-products-page.component';
import { AdminDataService } from '../services/admin-data.service';

describe('DashboardProductsPageComponent', () => {
  it('filters products by price range and resets active filters', async () => {
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
  });
});
