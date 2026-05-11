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
import { ActivatedRoute, Router } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import type { AdminDeliveryStatus } from '../models/admin-api.model';
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

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
  selectedOrderStatus: AdminDeliveryStatus = 'PENDING';
  drawerOpen = false;
  private routeSelectedOrderId: string | null = null;

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.routeSelectedOrderId = params.get('orderId');
      this.openOrderFromRoute();
      this.cdr.markForCheck();
    });

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
    return (
      !!this.selectedOrder?.deliveryOrder &&
      this.selectedOrder.source.status === 'PAID' &&
      this.selectedOrder.deliveryOrder.status !== 'DELIVERED' &&
      this.selectedOrder.deliveryOrder.status !== 'CANCELLED'
    );
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
    if (this.routeSelectedOrderId !== String(order.id)) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { orderId: order.id },
        queryParamsHandling: 'merge',
      });
    }

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
        this.selectedOrderStatus = response.data.deliveryOrder?.status ?? 'PENDING';
        this.cdr.markForCheck();
      });
  }

  closeDrawer(): void {
    this.drawerOpen = false;
    this.routeSelectedOrderId = null;
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { orderId: null },
      queryParamsHandling: 'merge',
    });
  }

  applyStatus(status: AdminDeliveryStatus): void {
    if (!this.selectedOrder || !this.canUpdateSelectedOrder) {
      return;
    }

    this.detailLoading = true;
    this.detailErrorMessage = null;
    this.adminData
      .updateDeliveryStatus(this.selectedOrder.id, status)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.detailLoading = false;
        if (!isApiSuccessResponse(response)) {
          this.detailErrorMessage = response.error;
          this.toastService.show({
            title: 'Status update failed',
            description: response.error,
            variant: 'error',
          });
          this.cdr.markForCheck();
          return;
        }

        this.selectedOrder = toOrderDetail(response.data);
        this.selectedOrderStatus = response.data.deliveryOrder?.status ?? 'PENDING';
        this.rows = this.rows.map((row) => (String(row.id) === String(response.data.id) ? toOrderRows([response.data])[0] : row));
        this.toastService.show({
          title: 'Order status updated',
          description: `Delivery status changed to ${this.formatDeliveryStatus(status)}.`,
          variant: 'success',
        });
        this.cdr.markForCheck();
      });
  }

  toggleLast30DaysFilter(): void {
    this.last30DaysFilterActive = !this.last30DaysFilterActive;
  }

  async openSelectedOrderPage(): Promise<void> {
    if (!this.selectedOrder) {
      return;
    }

    await this.router.navigate(['/orders', this.selectedOrder.id]);
  }

  printSelectedOrder(): void {
    if (!this.selectedOrder) {
      return;
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/orders', this.selectedOrder.id], {
        queryParams: { print: 1 },
      }),
    );

    window.open(url, '_blank', 'noopener,noreferrer');
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
          searchLabel: this.searchTerm.trim() || 'All orders',
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
        this.openOrderFromRoute();
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

  private openOrderFromRoute(): void {
    if (!this.routeSelectedOrderId || this.rows.length === 0) {
      return;
    }

    if (this.selectedOrder && String(this.selectedOrder.id) === this.routeSelectedOrderId && this.drawerOpen) {
      return;
    }

    const targetOrder = this.rows.find((order) => String(order.id) === this.routeSelectedOrderId);
    if (targetOrder) {
      this.openOrder(targetOrder);
    }
  }

  protected readonly deliveryStatusOptions: ReadonlyArray<{ value: AdminDeliveryStatus; label: string }> = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'OUT_FOR_SHIPMENT', label: 'Out for Shipment' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  get selectedOrderStatusOptions(): ReadonlyArray<{ value: AdminDeliveryStatus; label: string }> {
    switch (this.selectedOrder?.deliveryOrder?.status) {
      case 'PENDING':
        return this.deliveryStatusOptions.filter(
          (option) => option.value === 'PENDING' || option.value === 'OUT_FOR_SHIPMENT' || option.value === 'CANCELLED',
        );
      case 'OUT_FOR_SHIPMENT':
        return this.deliveryStatusOptions.filter(
          (option) => option.value === 'OUT_FOR_SHIPMENT' || option.value === 'DELIVERED' || option.value === 'CANCELLED',
        );
      case 'DELIVERED':
        return this.deliveryStatusOptions.filter((option) => option.value === 'DELIVERED');
      case 'CANCELLED':
        return this.deliveryStatusOptions.filter((option) => option.value === 'CANCELLED');
      default:
        return this.deliveryStatusOptions.filter((option) => option.value === 'PENDING');
    }
  }

  private formatDeliveryStatus(status: AdminDeliveryStatus): string {
    return status
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
