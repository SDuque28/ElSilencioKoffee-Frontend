import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
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
import { OrderDetailDrawerComponent } from '../components/order-detail-drawer.component';
import type { AdminMetric, AdminOrderDetail, AdminOrderRow } from '../models/admin-view.model';
import { toOrderDetail, toOrderRows } from '../services/admin-calculations';
import { AdminDashboardReportService } from '../services/admin-dashboard-report.service';
import { AdminDataService } from '../services/admin-data.service';
import { buildOrdersPageReport } from '../services/admin-page-reports';

@Component({
  selector: 'app-dashboard-orders-page',
  imports: [
    FormsModule,
    AdminDataTableComponent,
    AdminFilterSelectComponent,
    AdminMetricCardComponent,
    AdminStatusBadgeComponent,
    OrderDetailDrawerComponent,
  ],
  templateUrl: './dashboard-orders-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardOrdersPageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly reportService = inject(AdminDashboardReportService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  exporting = false;
  detailLoading = false;
  errorMessage: string | null = null;
  detailErrorMessage: string | null = null;
  searchTerm = '';
  statusFilter = 'ALL';
  last30DaysFilterActive = false;
  readonly statusOptions: AdminFilterSelectOption[] = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'Processing', label: 'Processing' },
    { value: 'Shipped', label: 'Shipped' },
    { value: 'Delivered', label: 'Delivered' },
    { value: 'Pending', label: 'Pending' },
  ];
  rows: AdminOrderRow[] = [];
  selectedOrder: AdminOrderDetail | null = null;
  selectedOrderStatus: 'PENDING' | 'PAID' = 'PENDING';
  drawerOpen = false;

  ngOnInit(): void {
    this.loadOrders();
  }

  get filteredRows(): AdminOrderRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    return this.rows.filter((order) => {
      const matchesQuery =
        !query ||
        order.orderCode.toLowerCase().includes(query) ||
        order.customer.toLowerCase().includes(query) ||
        order.customerEmail.toLowerCase().includes(query);
      const matchesStatus = this.statusFilter === 'ALL' || order.statusLabel === this.statusFilter;
      const matchesDateRange = !this.last30DaysFilterActive || this.isWithinLast30Days(order.rawDate);
      return matchesQuery && matchesStatus && matchesDateRange;
    });
  }

  get canUpdateSelectedOrder(): boolean {
    return this.selectedOrder?.source.status === 'PENDING';
  }

  get displayMetrics(): AdminMetric[] {
    return this.buildMetrics(this.filteredRows);
  }

  get statusFilterLabel(): string {
    return this.statusOptions.find((option) => option.value === this.statusFilter)?.label ?? 'All Statuses';
  }

  get dateFilterLabel(): string {
    return this.last30DaysFilterActive ? 'Last 30 Days' : 'All Dates';
  }

  openOrder(order: AdminOrderRow): void {
    this.drawerOpen = true;
    this.detailLoading = true;
    this.detailErrorMessage = null;
    this.selectedOrder = null;

    this.adminData
      .getAdminOrder(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.detailLoading = false;
        if (!isApiSuccessResponse(response)) {
          this.detailErrorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }
        this.selectedOrder = toOrderDetail(response.data);
        this.selectedOrderStatus = response.data.status === 'PAID' ? 'PAID' : 'PENDING';
        this.cdr.markForCheck();
      });
  }

  closeDrawer(): void {
    this.drawerOpen = false;
  }

  applyStatus(status: 'PENDING' | 'PAID'): void {
    if (!this.selectedOrder || !this.canUpdateSelectedOrder || status !== 'PAID') {
      return;
    }

    this.detailLoading = true;
    this.adminData
      .updateOrderStatus(this.selectedOrder.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.detailLoading = false;
        if (!isApiSuccessResponse(response)) {
          this.detailErrorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }
        this.selectedOrder = toOrderDetail(response.data);
        this.selectedOrderStatus = response.data.status === 'PAID' ? 'PAID' : 'PENDING';
        this.loadOrders(false);
      });
  }

  toggleLast30DaysFilter(): void {
    this.last30DaysFilterActive = !this.last30DaysFilterActive;
  }

  async exportOrders(): Promise<void> {
    if (this.exporting) {
      return;
    }

    this.exporting = true;
    this.cdr.markForCheck();

    try {
      await this.reportService.exportReport(
        buildOrdersPageReport({
          metrics: this.displayMetrics,
          rows: this.filteredRows,
          statusFilterLabel: this.statusFilterLabel,
          dateFilterLabel: this.dateFilterLabel,
        }),
      );
      this.toastService.show({
        title: 'Orders report generated',
        description: 'The filtered orders report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Orders export failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the report.',
        variant: 'error',
      });
    } finally {
      this.exporting = false;
      this.cdr.markForCheck();
    }
  }

  private loadOrders(markLoading = true): void {
    if (markLoading) {
      this.loading = true;
    }

    this.adminData
      .listAdminOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;
        if (!isApiSuccessResponse(response)) {
          this.errorMessage = response.error;
          this.rows = [];
          this.cdr.markForCheck();
          return;
        }

        this.errorMessage = null;
        this.rows = toOrderRows(response.data);
        this.cdr.markForCheck();
      });
  }

  private buildMetrics(rows: AdminOrderRow[]): AdminMetric[] {
    const latestDate = [...rows].sort((left, right) => left.rawDate.localeCompare(right.rawDate)).at(-1)?.rawDate;
    const latestDateKey = latestDate ? this.toDateKey(latestDate) : null;
    const todaysSales = rows
      .filter((row) => this.toDateKey(row.rawDate) === latestDateKey && row.paymentLabel === 'Paid')
      .reduce((sum, row) => sum + row.totalValue, 0);
    const pendingShipment = rows.filter(
      (row) => row.source.deliveryOrder?.status === 'PENDING' || row.source.deliveryOrder?.status === 'OUT_FOR_SHIPMENT',
    ).length;

    return [
      { label: 'Total Sales Today', value: this.formatCurrency(todaysSales), change: 'Latest date', tone: 'success' },
      { label: 'Pending Shipment', value: `${pendingShipment} Orders`, change: 'Live', tone: 'warning' },
      { label: 'Refund Rate', value: 'N/A', change: 'No refunds endpoint', tone: 'neutral' },
    ];
  }

  private isWithinLast30Days(value: string): boolean {
    const orderDate = new Date(value);
    if (Number.isNaN(orderDate.getTime())) {
      return false;
    }

    const latestDate = this.rows
      .map((row) => new Date(row.rawDate))
      .filter((date) => !Number.isNaN(date.getTime()))
      .sort((left, right) => left.getTime() - right.getTime())
      .at(-1);

    if (!latestDate) {
      return false;
    }

    const rangeStart = new Date(latestDate);
    rangeStart.setDate(rangeStart.getDate() - 29);

    return orderDate >= rangeStart && orderDate <= latestDate;
  }

  private toDateKey(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toISOString().slice(0, 10);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  }
}
