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
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import {
  AdminFilterSelectComponent,
  type AdminFilterSelectOption,
} from '../components/admin-filter-select.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import { ProductModalComponent } from '../components/product-modal.component';
import type { AdminProductCreateRequest } from '../models/admin-api.model';
import type { AdminMetric, AdminProductRow, AdminProductSummary } from '../models/admin-view.model';
import { buildProductSummary } from '../services/admin-calculations';
import { AdminDashboardReportService } from '../services/admin-dashboard-report.service';
import { AdminDataService } from '../services/admin-data.service';
import { buildProductsPageReport } from '../services/admin-page-reports';

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
  private readonly reportService = inject(AdminDashboardReportService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly failedProductImageIds = new Set<number>();

  @ViewChild(ProductModalComponent) private readonly productModal?: ProductModalComponent;

  loading = true;
  exporting = false;
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

  get categoryFilterLabel(): string {
    return this.categoryOptions.find((option) => option.value === this.categoryFilter)?.label ?? 'All Categories';
  }

  get stockFilterLabel(): string {
    return this.stockOptions.find((option) => option.value === this.stockFilter)?.label ?? 'Stock Status';
  }

  get priceRangeFilterLabel(): string {
    return this.priceRangeOptions.find((option) => option.value === this.priceRangeFilter)?.label ?? 'Price Range';
  }

  get filteredMetrics(): AdminMetric[] {
    const rows = this.filteredProducts;
    const activeListings = rows.filter((product) => product.stock > 0).length;
    const lowStock = rows.filter((product) => product.stock <= 10).length;
    const averagePrice =
      rows.length > 0 ? rows.reduce((sum, product) => sum + product.priceValue, 0) / rows.length : 0;

    return [
      { label: 'Filtered Products', value: String(rows.length), change: 'Current table results', tone: 'info' },
      { label: 'Active Listings', value: String(activeListings), change: 'Stock > 0', tone: 'success' },
      {
        label: 'Low-Stock Alert',
        value: String(lowStock),
        change: lowStock > 0 ? 'Review stock' : 'Stable',
        tone: lowStock > 0 ? 'warning' : 'success',
      },
      {
        label: 'Avg. Unit Price',
        value: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 2,
        }).format(averagePrice),
        change: 'Filtered results',
        tone: 'success',
      },
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

  productPlaceholderLabel(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .slice(0, 2);

    if (words.length === 0) {
      return 'PR';
    }

    return words.map((word) => word[0]?.toUpperCase() ?? '').join('');
  }

  hasPreviewImage(product: AdminProductRow): boolean {
    return Boolean(product.imageUrl?.trim()) && !this.failedProductImageIds.has(product.id);
  }

  handleProductImageError(productId: number): void {
    if (this.failedProductImageIds.has(productId)) {
      return;
    }

    this.failedProductImageIds.add(productId);
    this.cdr.markForCheck();
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

  async exportProducts(): Promise<void> {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.cdr.markForCheck();

    try {
      await this.reportService.exportReport(
        buildProductsPageReport({
          metrics: this.filteredMetrics,
          rows: this.filteredProducts,
          categoryFilterLabel: this.categoryFilterLabel,
          stockFilterLabel: this.stockFilterLabel,
          priceRangeFilterLabel: this.priceRangeFilterLabel,
        }),
      );
      this.toastService.show({
        title: 'Products report generated',
        description: 'The filtered products report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Products export failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the report.',
        variant: 'error',
      });
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
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
