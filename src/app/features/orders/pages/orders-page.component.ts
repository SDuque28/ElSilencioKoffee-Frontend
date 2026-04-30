import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Order } from '../../../core/models/order.model';
import { CardComponent } from '../../../shared/ui/card/card.component';
import {
  TableComponent,
  type TableColumn,
  type TableLinkCell,
} from '../../../shared/ui/table/table.component';
import { OrdersService } from '../services/orders.service';
import type { OrdersUserSummary } from '../services/users.service';
import { UsersService } from '../services/users.service';

@Component({
  selector: 'app-orders-page',
  imports: [CardComponent, TableComponent],
  templateUrl: './orders-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(OrdersService);
  private readonly usersService = inject(UsersService);
  readonly authService = inject(AuthService);

  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  private readonly adminColumns: TableColumn[] = [
    { key: 'id', label: 'Order ID' },
    { key: 'date', label: 'Date' },
    { key: 'customer', label: 'Customer' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ];

  private readonly userColumns: TableColumn[] = [
    { key: 'id', label: 'Order ID' },
    { key: 'date', label: 'Date' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
  ];

  loading = true;
  errorMessage: string | null = null;
  totalOrders = 0;
  rows: Record<string, unknown>[] = [];
  private adminUsersById = new Map<string, string>();

  get columns(): TableColumn[] {
    return this.authService.isAdmin() ? this.adminColumns : this.userColumns;
  }

  get heading(): string {
    return this.authService.isAdmin() ? 'All Orders' : 'My Orders';
  }

  get description(): string {
    return this.authService.isAdmin()
      ? 'Review every order placed in the store with the customer that created it.'
      : 'Track the orders placed from your account in the store.';
  }

  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = null;

    if (this.authService.isAdmin()) {
      this.loadAdminOrders();
      return;
    }

    this.loadUserOrders();
  }

  private loadAdminOrders(): void {
    forkJoin({
      ordersResponse: this.ordersService.listOrders(),
      usersResponse: this.usersService.listUsers(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ ordersResponse, usersResponse }) => {
        this.loading = false;

        if (!isApiSuccessResponse(ordersResponse)) {
          this.rows = [];
          this.totalOrders = 0;
          this.errorMessage = ordersResponse.error;
          this.cdr.markForCheck();
          return;
        }

        this.adminUsersById = isApiSuccessResponse(usersResponse)
          ? this.buildUsersMap(usersResponse.data)
          : new Map<string, string>();

        this.rows = ordersResponse.data.orders.map((order) => this.toRow(order));
        this.totalOrders = ordersResponse.data.totalElements;
        this.errorMessage = null;
        this.cdr.markForCheck();
      });
  }

  private loadUserOrders(): void {
    this.ordersService
      .listOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.loading = false;

        if (!isApiSuccessResponse(response)) {
          this.rows = [];
          this.totalOrders = 0;
          this.errorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }

        this.rows = response.data.orders.map((order) => this.toRow(order));
        this.totalOrders = response.data.totalElements;
        this.errorMessage = null;
        this.cdr.markForCheck();
      });
  }

  private toRow(order: Order): Record<string, unknown> {
    const orderLink = `/orders/${order.id}`;
    const baseRow: Record<string, unknown> = {
      __rowLink: orderLink,
      __rowDataCy: `orders-row-${order.id}`,
      id: {
        label: `#${order.id}`,
        routerLink: orderLink,
        dataCy: `orders-link-${order.id}`,
      } satisfies TableLinkCell,
      date: this.formatOrderDate(order.orderDate),
      total: this.currencyFormatter.format(order.totalAmount),
      status: order.status,
    };

    if (this.authService.isAdmin()) {
      baseRow['customer'] = this.resolveCustomerName(order.userId);
    }

    return baseRow;
  }

  private resolveCustomerName(userId: string | number): string {
    return this.adminUsersById.get(String(userId)) ?? `User #${userId}`;
  }

  private buildUsersMap(users: OrdersUserSummary[]): Map<string, string> {
    return new Map(users.map((user) => [String(user.id), user.username]));
  }

  private formatOrderDate(value: string): string {
    const parsedDate = new Date(value);

    if (Number.isNaN(parsedDate.getTime())) {
      return value;
    }

    return this.dateFormatter.format(parsedDate);
  }
}
