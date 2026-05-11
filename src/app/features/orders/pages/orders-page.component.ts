import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  type OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { Order } from '../../../core/models/order.model';
import { BadgeComponent } from '../../../shared/ui/badge/badge.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { OrdersService } from '../services/orders.service';
import type { OrdersUserSummary } from '../services/users.service';
import { UsersService } from '../services/users.service';
import {
  buildOrderItemsPreview,
  formatOrderCode,
  formatOrderCurrency,
  formatOrderDate,
  getDeliveryStatusPresentation,
  getOrderItemsSummary,
  getPaymentStatusPresentation,
  getPrimaryOrderStatusPresentation,
  getShippingDestination,
  type OrderBadgePresentation,
} from '../utils/order-presentation';

interface OrdersPageMetric {
  label: string;
  value: string;
  supportingText: string;
  tone: 'default' | 'success' | 'warning';
}

interface OrdersPageCard {
  id: string | number;
  route: string;
  orderCode: string;
  date: string;
  total: string;
  customerName: string | null;
  customerEmail: string | null;
  itemSummary: string;
  itemPreview: string[];
  notes: string | null;
  destination: string | null;
  primaryStatus: OrderBadgePresentation;
  paymentStatus: OrderBadgePresentation;
  deliveryStatus: OrderBadgePresentation;
}

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [RouterLink, CardComponent, BadgeComponent],
  templateUrl: './orders-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ordersService = inject(OrdersService);
  private readonly usersService = inject(UsersService);
  readonly authService = inject(AuthService);

  loading = true;
  errorMessage: string | null = null;
  totalOrders = 0;
  orderCards: OrdersPageCard[] = [];
  metrics: OrdersPageMetric[] = [];
  private adminUsersById = new Map<string, string>();

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
          this.setFailedState(ordersResponse.error);
          return;
        }

        this.adminUsersById = isApiSuccessResponse(usersResponse)
          ? this.buildUsersMap(usersResponse.data)
          : new Map<string, string>();
        this.setOrders(ordersResponse.data.orders);
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
          this.setFailedState(response.error);
          return;
        }

        this.setOrders(response.data.orders);
        this.cdr.markForCheck();
      });
  }

  private resolveCustomerName(userId: string | number): string {
    return this.adminUsersById.get(String(userId)) ?? `User #${userId}`;
  }

  private buildUsersMap(users: OrdersUserSummary[]): Map<string, string> {
    return new Map(users.map((user) => [String(user.id), user.username]));
  }

  private setOrders(orders: Order[]): void {
    this.totalOrders = orders.length;
    this.orderCards = orders.map((order) => this.toCard(order));
    this.metrics = this.buildMetrics(orders);
    this.errorMessage = null;
  }

  private setFailedState(message: string): void {
    this.orderCards = [];
    this.metrics = [];
    this.totalOrders = 0;
    this.errorMessage = message;
    this.cdr.markForCheck();
  }

  private toCard(order: Order): OrdersPageCard {
    return {
      id: order.id,
      route: `/orders/${order.id}`,
      orderCode: formatOrderCode(order.id),
      date: formatOrderDate(order.orderDate, 'detailed'),
      total: formatOrderCurrency(order.totalAmount),
      customerName: this.authService.isAdmin() ? this.resolveCustomerName(order.userId) : order.customer?.username ?? null,
      customerEmail: this.authService.isAdmin() ? order.customer?.email ?? null : null,
      itemSummary: getOrderItemsSummary(order.items),
      itemPreview: buildOrderItemsPreview(order.items, 3),
      notes: order.notes ?? null,
      destination: getShippingDestination(order),
      primaryStatus: getPrimaryOrderStatusPresentation(order),
      paymentStatus: getPaymentStatusPresentation(order),
      deliveryStatus: getDeliveryStatusPresentation(order),
    };
  }

  private buildMetrics(orders: Order[]): OrdersPageMetric[] {
    const paidOrders = orders.filter((order) => getPaymentStatusPresentation(order).label === 'Paid');
    const deliveredOrders = orders.filter((order) => getDeliveryStatusPresentation(order).label === 'Delivered');
    const pendingOrders = orders.filter((order) => getPaymentStatusPresentation(order).label === 'Payment Pending');

    if (this.authService.isAdmin()) {
      const customers = new Set(orders.map((order) => String(order.userId))).size;
      const pendingShipment = orders.filter(
        (order) =>
          getDeliveryStatusPresentation(order).label === 'Preparing Shipment' ||
          getDeliveryStatusPresentation(order).label === 'Out for Shipment',
      ).length;

      return [
        {
          label: 'Orders Managed',
          value: String(orders.length),
          supportingText: 'Across the current store history',
          tone: 'default',
        },
        {
          label: 'Paid Revenue',
          value: formatOrderCurrency(paidOrders.reduce((sum, order) => sum + order.totalAmount, 0)),
          supportingText: `${paidOrders.length} paid ${paidOrders.length === 1 ? 'order' : 'orders'}`,
          tone: 'success',
        },
        {
          label: 'Pending Fulfillment',
          value: String(pendingShipment),
          supportingText: 'Orders still in preparation or transit',
          tone: pendingShipment > 0 ? 'warning' : 'success',
        },
        {
          label: 'Customers',
          value: String(customers),
          supportingText: 'Unique buyers represented in this view',
          tone: 'default',
        },
      ];
    }

    return [
      {
        label: 'Orders Placed',
        value: String(orders.length),
        supportingText: 'All purchases from this account',
        tone: 'default',
      },
      {
        label: 'Amount Paid',
        value: formatOrderCurrency(paidOrders.reduce((sum, order) => sum + order.totalAmount, 0)),
        supportingText: `${paidOrders.length} paid ${paidOrders.length === 1 ? 'order' : 'orders'}`,
        tone: 'success',
      },
      {
        label: 'Pending Payment',
        value: String(pendingOrders.length),
        supportingText: 'Orders that still require checkout completion',
        tone: pendingOrders.length > 0 ? 'warning' : 'success',
      },
      {
        label: 'Delivered',
        value: String(deliveredOrders.length),
        supportingText: 'Orders completed and received',
        tone: deliveredOrders.length > 0 ? 'success' : 'default',
      },
    ];
  }
}
