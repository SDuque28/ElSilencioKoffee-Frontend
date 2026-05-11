import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Printer, X, LucideAngularModule } from 'lucide-angular';

import type { AdminDeliveryStatus } from '../models/admin-api.model';
import type { AdminOrderDetail } from '../models/admin-view.model';
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
        class="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/10 bg-[#111112] shadow-2xl"
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
            <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-xs font-semibold text-[#f97316]">{{ order.orderCode }}</p>
                  <h3 class="mt-1 text-lg font-semibold text-white">{{ order.customer }}</h3>
                  <p class="text-xs text-zinc-500">{{ order.date }}</p>
                </div>
                <app-admin-status-badge [label]="order.statusLabel" [tone]="order.statusTone" />
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2">
                <div class="rounded-md border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Payment Status</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ order.source.status }}</p>
                </div>
                <div class="rounded-md border border-white/5 bg-black/20 p-3">
                  <p class="text-[11px] font-semibold uppercase text-zinc-500">Delivery Status</p>
                  <p class="mt-2 text-sm font-medium text-white">{{ order.deliveryOrder?.status ?? 'N/A' }}</p>
                </div>
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
            </section>

            <section class="mt-5">
              <h3 class="mb-3 text-xs font-semibold uppercase text-zinc-500">
                Purchased Products ({{ order.items.length }})
              </h3>
              <div class="space-y-2 rounded-lg border border-white/10 bg-[#1b1b1d] p-3">
                @for (item of order.items; track item.productName) {
                  <div class="grid grid-cols-[1fr_auto_auto] items-center gap-3 border-b border-white/5 py-2 last:border-b-0">
                    <p class="text-sm text-white">{{ item.productName }}</p>
                    <p class="text-xs text-zinc-400">x{{ item.quantity }}</p>
                    <p class="text-sm font-semibold text-white">{{ item.subtotal }}</p>
                  </div>
                }
                <div class="flex items-center justify-between pt-2 text-sm">
                  <span class="text-zinc-500">Order Total</span>
                  <span class="font-semibold text-[#f97316]">{{ order.total }}</span>
                </div>
              </div>
            </section>

            <div class="mt-5 grid gap-3 sm:grid-cols-2">
              <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-4">
                <h3 class="text-[11px] font-semibold uppercase text-[#f97316]">Shipping Address</h3>
                <p class="mt-3 text-sm text-zinc-300">{{ order.shippingInformation?.address ?? 'N/A' }}</p>
                <p class="text-sm text-zinc-400">
                  {{ order.shippingInformation?.city ?? 'N/A' }},
                  {{ order.shippingInformation?.neighborhood ?? 'N/A' }}
                </p>
                <p class="text-sm text-zinc-400">{{ order.shippingInformation?.country ?? 'N/A' }}</p>
              </section>
              <section class="rounded-lg border border-white/10 bg-[#1b1b1d] p-4">
                <h3 class="text-[11px] font-semibold uppercase text-[#f97316]">Contact Info</h3>
                <p class="mt-3 text-sm text-zinc-300">{{ order.customerEmail }}</p>
                <p class="text-sm text-zinc-500">Phone: N/A</p>
              </section>
            </div>

            <section class="mt-5 rounded-lg border border-white/10 bg-[#1b1b1d] p-4">
              <h3 class="text-[11px] font-semibold uppercase text-zinc-500">Order History</h3>
              <p class="mt-3 text-sm text-zinc-400">
                Current order status: {{ order.source.status }}. Delivery:
                {{ order.deliveryOrder?.status ?? 'N/A' }}.
              </p>
            </section>
          }
        </div>

        <footer class="flex items-center justify-between border-t border-white/10 p-4">
          <p class="text-xs text-zinc-500">Print opens the full order detail page in a printable view. Archive flows still need backend support.</p>
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
}
