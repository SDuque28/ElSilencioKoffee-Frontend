import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Printer, X, LucideAngularModule } from 'lucide-angular';

import type { AdminDeliveryStatus } from '../models/admin-api.model';
import type { AdminBadgeTone, AdminOrderDetail } from '../models/admin-view.model';
import { AdminStatusBadgeComponent } from './admin-status-badge.component';

@Component({
  selector: 'app-order-detail-drawer',
  imports: [FormsModule, LucideAngularModule, AdminStatusBadgeComponent],
  template: `
    @if (open) {
      <div
        class="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        tabindex="0"
        role="button"
        (click)="closed.emit()"
        (keydown.enter)="closed.emit()"
        (keydown.space)="closed.emit()"
      ></div>
      <aside
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col border-l border-white/10 bg-[#111112] shadow-2xl"
        data-cy="admin-order-detail-drawer"
      >
        <header class="flex h-14 items-center justify-between border-b border-white/10 px-5">
          <button type="button" class="text-zinc-500 hover:text-white" (click)="closed.emit()">
            <lucide-icon [img]="icons.close" class="h-4 w-4" />
          </button>
          <h2 class="text-sm font-semibold text-white">Order Details</h2>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-md bg-white/5 px-3 py-1.5 text-xs text-zinc-300 disabled:opacity-50"
            [disabled]="!order || loading"
            (click)="printRequested.emit()"
          >
            <lucide-icon [img]="icons.print" class="h-3.5 w-3.5" />
            Print Invoice
          </button>
        </header>

        <div class="flex-1 overflow-y-auto p-5">
          @if (loading) {
            <p class="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-zinc-400">
              Loading order detail...
            </p>
          } @else if (errorMessage) {
            <p class="rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200">
              {{ errorMessage }}
            </p>
          } @else if (order) {
            <section class="rounded-2xl border border-white/10 bg-[#1b1b1d] p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold text-[#f97316]">{{ order.orderCode }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-white">{{ order.customer }}</h3>
                  <p class="text-xs text-zinc-500">{{ order.date }}</p>
                </div>
                <app-admin-status-badge [label]="order.statusLabel" [tone]="order.statusTone" />
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Order Total</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ order.total }}</p>
                </div>
                <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Items</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ order.items.length }} line items</p>
                </div>
                <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Payment Status</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ paymentStatusLabel }}</p>
                </div>
                <div class="rounded-xl border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Delivery Status</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ deliveryStatusLabel }}</p>
                </div>
              </div>

              <div class="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                <div class="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p class="text-[11px] font-semibold uppercase text-zinc-500">Delivery Workflow</p>
                    <p class="mt-2 text-sm text-zinc-400">
                      Update the shipment milestone when the order is already paid.
                    </p>
                  </div>
                  @if (order.deliveryOrder) {
                    <app-admin-status-badge [label]="deliveryStatusLabel" [tone]="deliveryStatusTone" />
                  }
                </div>

                <label for="admin-order-status" class="mt-5 block text-[11px] font-semibold uppercase text-zinc-500">
                  Update Delivery Status
                </label>
                <select
                  id="admin-order-status"
                  class="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#1b1b1d] px-3 text-sm text-white [color-scheme:dark]"
                  [disabled]="!canUpdateStatus || loading"
                  [(ngModel)]="selectedStatus"
                >
                  @for (option of statusOptions; track option.value) {
                    <option [value]="option.value" class="bg-[#1b1b1d] text-white">{{ option.label }}</option>
                  }
                </select>
                <button
                  type="button"
                  class="mt-3 w-full rounded-md bg-[#f97316] px-3 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
                  [disabled]="!canSubmitStatusChange"
                  (click)="statusApplied.emit(selectedStatus)"
                >
                  {{ loading ? 'Saving...' : 'Apply Changes' }}
                </button>
                @if (!canUpdateStatus) {
                  <p class="mt-2 text-xs text-zinc-500">{{ statusHelperText }}</p>
                }
              </div>
            </section>

            <section class="mt-5">
              <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 class="text-xs font-semibold uppercase text-zinc-500">
                  Purchased Products ({{ order.items.length }})
                </h3>
                <p class="text-xs text-zinc-500">This stays aligned with the full customer-facing order page.</p>
              </div>

              <div class="space-y-3 rounded-2xl border border-white/10 bg-[#1b1b1d] p-3">
                @for (item of order.items; track item.productName) {
                  <div class="rounded-xl border border-white/5 bg-black/20 p-4">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p class="text-sm font-medium text-white">{{ item.productName }}</p>
                        <p class="mt-2 text-xs text-zinc-400">
                          {{ item.quantity }} {{ item.quantity === 1 ? 'unit' : 'units' }} at {{ item.unitPrice }}
                        </p>
                      </div>
                      <p class="text-sm font-semibold text-white">{{ item.subtotal }}</p>
                    </div>
                  </div>
                }
                <div class="flex items-center justify-between px-1 pt-1 text-sm">
                  <span class="text-zinc-500">Order Total</span>
                  <span class="font-semibold text-[#f97316]">{{ order.total }}</span>
                </div>
              </div>
            </section>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <section class="rounded-2xl border border-white/10 bg-[#1b1b1d] p-4">
                <h3 class="text-[11px] font-semibold uppercase text-[#f97316]">Shipping Address</h3>
                @if (order.shippingInformation) {
                  <p class="mt-3 text-sm text-zinc-300">{{ order.shippingInformation.address }}</p>
                  <p class="text-sm text-zinc-400">
                    {{ order.shippingInformation.city }},
                    {{ order.shippingInformation.neighborhood }}
                  </p>
                  <p class="text-sm text-zinc-400">{{ order.shippingInformation.country }}</p>
                  @if (order.shippingInformation.referenceDetails) {
                    <p class="mt-2 text-sm text-zinc-500">
                      Reference: {{ order.shippingInformation.referenceDetails }}
                    </p>
                  }
                } @else {
                  <p class="mt-3 text-sm text-zinc-500">Shipping information is not available for this order.</p>
                }
              </section>

              <section class="rounded-2xl border border-white/10 bg-[#1b1b1d] p-4">
                <h3 class="text-[11px] font-semibold uppercase text-[#f97316]">Payment Reference</h3>
                @if (order.payment) {
                  <p class="mt-3 text-sm text-zinc-300">{{ paymentMethodLabel }}</p>
                  <p class="mt-1 text-sm text-zinc-400">{{ order.payment.maskedCardNumber }}</p>
                  <p class="mt-1 text-sm text-zinc-500">Ref: {{ order.payment.transactionReference }}</p>
                } @else {
                  <p class="mt-3 text-sm text-zinc-500">Payment details will appear after checkout is completed.</p>
                }
              </section>
            </div>

            <section class="mt-5 rounded-2xl border border-white/10 bg-[#1b1b1d] p-4">
              <h3 class="text-[11px] font-semibold uppercase text-zinc-500">Activity Snapshot</h3>
              <p class="mt-3 text-sm text-zinc-400">
                Customer contact: {{ order.customerEmail }}.
                @if (paidAtLabel) {
                  Payment confirmed {{ paidAtLabel }}.
                }
                @if (deliveryUpdatedLabel) {
                  Delivery updated {{ deliveryUpdatedLabel }}.
                }
              </p>
            </section>
          }
        </div>

        <footer class="flex items-center justify-between border-t border-white/10 p-4">
          <p class="text-xs text-zinc-500">
            Print opens the public-friendly full order detail page in a printable view.
          </p>
          <button
            type="button"
            class="rounded-md bg-[#f97316] px-3 py-2 text-xs font-semibold text-black disabled:opacity-50"
            [disabled]="!order"
            (click)="detailsRequested.emit()"
          >
            Full Details
          </button>
        </footer>
      </aside>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailDrawerComponent {
  @Input() statusOptions: ReadonlyArray<{ value: AdminDeliveryStatus; label: string }> = [];
  @Input() open = false;
  @Input() loading = false;
  @Input() errorMessage: string | null = null;
  @Input() order: AdminOrderDetail | null = null;
  @Input() canUpdateStatus = false;
  @Input() selectedStatus: AdminDeliveryStatus = 'PENDING';
  @Output() closed = new EventEmitter<void>();
  @Output() statusApplied = new EventEmitter<AdminDeliveryStatus>();
  @Output() detailsRequested = new EventEmitter<void>();
  @Output() printRequested = new EventEmitter<void>();

  protected readonly icons = {
    close: X,
    print: Printer,
  };

  get canSubmitStatusChange(): boolean {
    return (
      this.canUpdateStatus &&
      !this.loading &&
      !!this.order?.deliveryOrder &&
      this.selectedStatus !== this.order.deliveryOrder.status
    );
  }

  get statusHelperText(): string {
    if (!this.order) {
      return 'Select an order to manage its delivery status.';
    }

    if (!this.order.deliveryOrder) {
      return 'This order does not have delivery tracking information yet.';
    }

    if (this.order.source.status !== 'PAID') {
      return 'Delivery status can be updated after the order payment is completed.';
    }

    return 'This delivery status is locked because the order is already completed or cancelled.';
  }

  get paymentStatusLabel(): string {
    if (!this.order) {
      return 'N/A';
    }

    if (this.order.payment?.status === 'APPROVED' || this.order.source.status === 'PAID') {
      return 'Paid';
    }

    if (this.order.payment?.status === 'DECLINED') {
      return 'Declined';
    }

    return 'Pending';
  }

  get deliveryStatusLabel(): string {
    if (!this.order?.deliveryOrder) {
      return 'Not started';
    }

    switch (this.order.deliveryOrder.status) {
      case 'OUT_FOR_SHIPMENT':
        return 'Out for Shipment';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return 'Pending';
    }
  }

  get deliveryStatusTone(): AdminBadgeTone {
    if (!this.order?.deliveryOrder) {
      return 'neutral';
    }

    switch (this.order.deliveryOrder.status) {
      case 'OUT_FOR_SHIPMENT':
        return 'info';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'warning';
    }
  }

  get paymentMethodLabel(): string {
    if (!this.order?.payment) {
      return 'N/A';
    }

    return this.toTitleCase(this.order.payment.paymentMethod);
  }

  get paidAtLabel(): string | null {
    return this.order?.payment?.paidAt ? this.formatTimestamp(this.order.payment.paidAt) : null;
  }

  get deliveryUpdatedLabel(): string | null {
    return this.order?.deliveryOrder?.updatedAt
      ? this.formatTimestamp(this.order.deliveryOrder.updatedAt)
      : null;
  }

  private formatTimestamp(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  private toTitleCase(value: string): string {
    return value
      .toLowerCase()
      .split('_')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
