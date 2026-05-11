import { inject, Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import type { AdminNotificationItem } from '../models/admin-view.model';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { AdminSnapshotApi } from '../models/admin-api.model';
import { AdminDataService } from './admin-data.service';

@Injectable({
  providedIn: 'root',
})
export class AdminViewNavigationService {
  private readonly router = inject(Router);
  private readonly adminData = inject(AdminDataService);

  navigateToRoasteryView(): Promise<boolean> {
    return this.router.navigateByUrl('/');
  }

  navigateFromNotification(notification: AdminNotificationItem): Promise<boolean> {
    return this.router.navigateByUrl(notification.route);
  }

  async navigateFromGlobalSearch(query: string): Promise<boolean> {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      return false;
    }

    const response = await firstValueFrom(this.adminData.getSnapshot());
    if (!isApiSuccessResponse(response)) {
      throw new Error(response.error);
    }

    const match = this.resolveBestSearchRoute(response.data, normalizedQuery);

    return this.router.navigate([match.route], {
      queryParams: match.queryParams,
    });
  }

  navigateToAdminOrder(orderId: string | number, extras?: { q?: string | null }): Promise<boolean> {
    return this.router.navigate(['/dashboard/orders'], {
      queryParams: {
        orderId,
        q: extras?.q ?? undefined,
      },
    });
  }

  private resolveBestSearchRoute(
    snapshot: AdminSnapshotApi,
    query: string,
  ): {
    route: string;
    queryParams: Record<string, string>;
  } {
    const normalizedQuery = query.toLowerCase();

    const orderMatches = snapshot.orders.filter((order) => {
      const orderCode = `#COF-${String(order.id).padStart(4, '0')}`.toLowerCase();
      return (
        orderCode.includes(normalizedQuery) ||
        (order.customer?.username ?? '').toLowerCase().includes(normalizedQuery) ||
        (order.customer?.email ?? '').toLowerCase().includes(normalizedQuery)
      );
    }).length;

    const userMatches = snapshot.users.filter(
      (user) =>
        user.username.toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery),
    ).length;

    const productMatches = snapshot.products.filter((product) => {
      const category = this.resolvePresentationLabel(product.presentationId).toLowerCase();
      return (
        product.name.toLowerCase().includes(normalizedQuery) ||
        category.includes(normalizedQuery)
      );
    }).length;

    if (orderMatches >= userMatches && orderMatches >= productMatches) {
      return {
        route: '/dashboard/orders',
        queryParams: { q: query },
      };
    }

    if (userMatches >= productMatches) {
      return {
        route: '/dashboard/users',
        queryParams: { q: query },
      };
    }

    return {
      route: '/dashboard/products',
      queryParams: { q: query },
    };
  }

  private resolvePresentationLabel(presentationId: number | string | null): string {
    switch (Number(presentationId)) {
      case 1:
        return 'Bag 340g';
      case 2:
        return 'Capsules';
      case 3:
        return 'Equipment';
      case 4:
        return 'Blend';
      default:
        return 'Coffee';
    }
  }
}
