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
import { ActivatedRoute } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { DialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import {
  AdminFilterSelectComponent,
  type AdminFilterSelectOption,
} from '../components/admin-filter-select.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import {
  ProductModalComponent,
  type AdminProductFormSubmission,
  type AdminProductFormValue,
} from '../components/product-modal.component';
import type { AdminProductCreateRequest, AdminProductUpdateRequest } from '../models/admin-api.model';
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
    DialogComponent,
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
  private readonly route = inject(ActivatedRoute);
  private readonly failedProductImageIds = new Set<number>();

  @ViewChild(ProductModalComponent) private readonly productModal?: ProductModalComponent;

  loading = true;
  exporting = false;
  saving = false;
  deleting = false;
  errorMessage: string | null = null;
  modalErrorMessage: string | null = null;
  searchTerm = '';
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
  modalMode: 'create' | 'edit' = 'create';
  editingProduct: AdminProductRow | null = null;
  productPendingDelete: AdminProductRow | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.cdr.markForCheck();
    });

    this.loadProducts();
  }

  get filteredProducts(): AdminProductRow[] {
    const rows = this.summary?.products ?? [];
    const query = this.searchTerm.trim().toLowerCase();
    return rows.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query) ||
        product.statusLabel.toLowerCase().includes(query);
      const matchesCategory = this.categoryFilter === 'ALL' || product.category === this.categoryFilter;
      const matchesStock =
        this.stockFilter === 'ALL' ||
        (this.stockFilter === 'ACTIVE' && product.statusLabel === 'Active') ||
        (this.stockFilter === 'LOW' && product.statusLabel === 'Low Stock') ||
        (this.stockFilter === 'DRAFT' && product.statusLabel === 'Draft');
      const matchesPriceRange = this.matchesPriceRange(product.priceValue);

      return matchesSearch && matchesCategory && matchesStock && matchesPriceRange;
    });
  }

  get hasActiveFilters(): boolean {
    return (
      this.searchTerm.trim().length > 0 ||
      this.categoryFilter !== 'ALL' ||
      this.stockFilter !== 'ALL' ||
      this.priceRangeFilter !== 'ALL'
    );
  }

  get modalInitialValue(): AdminProductFormValue | null {
    if (!this.editingProduct) {
      return null;
    }

    return {
      name: this.editingProduct.name,
      imageUrl: this.editingProduct.imageUrl ?? '',
      price: this.editingProduct.priceValue,
      stockQuantity: this.editingProduct.stock,
      presentationId: this.editingProduct.presentationId,
      productionId: this.editingProduct.productionId,
    };
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
    this.modalMode = 'create';
    this.editingProduct = null;
    this.modalErrorMessage = null;
    this.modalOpen = true;
  }

  closeModal(): void {
    this.modalOpen = false;
    this.modalMode = 'create';
    this.editingProduct = null;
    this.productModal?.reset();
  }

  editProduct(product: AdminProductRow): void {
    this.modalMode = 'edit';
    this.editingProduct = product;
    this.modalErrorMessage = null;
    this.modalOpen = true;
  }

  saveProduct(formValue: AdminProductFormSubmission): void {
    const isEditMode = this.modalMode === 'edit';
    this.saving = true;
    this.modalErrorMessage = null;
    const request$ =
      isEditMode && this.editingProduct
        ? this.adminData.updateProduct(this.editingProduct.id, this.toUpdateRequest(formValue))
        : this.adminData.createProduct(this.toCreateRequest(formValue));

    request$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.saving = false;
        if (!isApiSuccessResponse(response)) {
          this.modalErrorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }
        this.closeModal();
        this.toastService.show({
          title: isEditMode ? 'Product updated' : 'Product created',
          description:
            isEditMode
              ? 'The product changes were saved successfully.'
              : 'The new product is now available in the admin catalog.',
          variant: 'success',
        });
        this.loadProducts(false);
      });
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.categoryFilter = 'ALL';
    this.stockFilter = 'ALL';
    this.priceRangeFilter = 'ALL';
  }

  requestDeleteProduct(product: AdminProductRow): void {
    this.productPendingDelete = product;
  }

  closeDeleteDialog(): void {
    if (this.deleting) {
      return;
    }

    this.productPendingDelete = null;
  }

  confirmDeleteProduct(): void {
    if (!this.productPendingDelete) {
      return;
    }

    this.deleting = true;
    this.adminData
      .deleteProduct(this.productPendingDelete.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.deleting = false;

        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Product deletion failed',
            description: response.error,
            variant: 'error',
          });
          this.cdr.markForCheck();
          return;
        }

        this.toastService.show({
          title: 'Product deleted',
          description: 'The product was removed from the catalog.',
          variant: 'success',
        });
        this.productPendingDelete = null;
        this.loadProducts(false);
      });
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
        this.summary = buildProductSummary(response.data.products, response.data.production, response.data.inventory);
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
          searchLabel: this.searchTerm.trim() || 'All products',
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

  private toCreateRequest(formValue: AdminProductFormSubmission): AdminProductCreateRequest {
    return {
      name: formValue.name,
      imageUrl: formValue.imageUrl,
      price: formValue.price,
      presentationId: formValue.presentationId,
      productionId: formValue.productionId,
    };
  }

  private toUpdateRequest(formValue: AdminProductFormSubmission): AdminProductUpdateRequest {
    return {
      ...this.toCreateRequest(formValue),
      stockQuantity: formValue.stockQuantity,
    };
  }
}
