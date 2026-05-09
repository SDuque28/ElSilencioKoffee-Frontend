import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ViewChild,
  inject,
  type OnInit,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import {
  AdminFilterSelectComponent,
  type AdminFilterSelectOption,
} from '../components/admin-filter-select.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import { ProductModalComponent } from '../components/product-modal.component';
import type { AdminProductCreateRequest } from '../models/admin-api.model';
import type { AdminProductRow, AdminProductSummary } from '../models/admin-view.model';
import { buildProductSummary } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';

@Component({
  selector: 'app-dashboard-products-page',
  imports: [
    FormsModule,
    AdminDataTableComponent,
    AdminFilterSelectComponent,
    AdminMetricCardComponent,
    AdminStatusBadgeComponent,
    ProductModalComponent,
  ],
  templateUrl: './dashboard-products-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardProductsPageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(ProductModalComponent) private readonly productModal?: ProductModalComponent;

  loading = true;
  saving = false;
  errorMessage: string | null = null;
  modalErrorMessage: string | null = null;
  categoryFilter = 'ALL';
  stockFilter = 'ALL';
  priceRangeFilter = 'ALL';
  readonly stockOptions: AdminFilterSelectOption[] = [
    { value: 'ALL', label: 'Stock Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'LOW', label: 'Low Stock' },
    { value: 'DRAFT', label: 'Draft' },
  ];
  readonly priceRangeOptions: AdminFilterSelectOption[] = [
    { value: 'ALL', label: 'Price Range' },
    { value: 'UNDER_25', label: 'Under $25' },
    { value: 'BETWEEN_25_50', label: '$25 - $50' },
    { value: 'BETWEEN_50_100', label: '$50 - $100' },
    { value: 'ABOVE_100', label: '$100+' },
  ];
  modalOpen = false;
  summary: AdminProductSummary | null = null;

  ngOnInit(): void {
    this.loadProducts();
  }

  get filteredProducts(): AdminProductRow[] {
    const rows = this.summary?.products ?? [];
    return rows.filter((product) => {
      const matchesCategory = this.categoryFilter === 'ALL' || product.category === this.categoryFilter;
      const matchesStock =
        this.stockFilter === 'ALL' ||
        (this.stockFilter === 'ACTIVE' && product.statusLabel === 'Active') ||
        (this.stockFilter === 'LOW' && product.statusLabel === 'Low Stock') ||
        (this.stockFilter === 'DRAFT' && product.statusLabel === 'Draft');
      const matchesPriceRange = this.matchesPriceRange(product.priceValue);

      return matchesCategory && matchesStock && matchesPriceRange;
    });
  }

  get hasActiveFilters(): boolean {
    return (
      this.categoryFilter !== 'ALL' ||
      this.stockFilter !== 'ALL' ||
      this.priceRangeFilter !== 'ALL'
    );
  }

  get categoryOptions(): AdminFilterSelectOption[] {
    return [
      { value: 'ALL', label: 'All Categories' },
      ...((this.summary?.presentationOptions ?? []).map((option) => ({
        value: option.label,
        label: option.label,
      })) as AdminFilterSelectOption[]),
    ];
  }

  openModal(): void {
    this.modalErrorMessage = null;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.productModal?.reset();
  }

  saveProduct(payload: AdminProductCreateRequest): void {
    this.saving = true;
    this.modalErrorMessage = null;
    this.adminData
      .createProduct(payload)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.saving = false;
        if (!isApiSuccessResponse(response)) {
          this.modalErrorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }
        this.closeModal();
        this.loadProducts(false);
      });
  }

  clearFilters(): void {
    this.categoryFilter = 'ALL';
    this.stockFilter = 'ALL';
    this.priceRangeFilter = 'ALL';
  }

  private loadProducts(markLoading = true): void {
    if (markLoading) {
      this.loading = true;
    }

    this.adminData
      .getSnapshot()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;
        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.summary = null;
          this.cdr.markForCheck();
          return;
        }
        this.errorMessage = null;
        this.summary = buildProductSummary(response.data.products, response.data.production);
        this.cdr.markForCheck();
      });
  }

  private matchesPriceRange(price: number): boolean {
    switch (this.priceRangeFilter) {
      case 'UNDER_25':
        return price < 25;
      case 'BETWEEN_25_50':
        return price >= 25 && price <= 50;
      case 'BETWEEN_50_100':
        return price > 50 && price <= 100;
      case 'ABOVE_100':
        return price > 100;
      default:
        return true;
    }
  }
}
