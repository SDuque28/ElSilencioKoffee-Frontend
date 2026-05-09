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
      return matchesCategory && matchesStock;
    });
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
}
