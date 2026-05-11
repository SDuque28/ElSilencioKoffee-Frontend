import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { AdminNotificationItem } from '../models/admin-view.model';
import { buildAdminNotifications } from './admin-notifications';
import { AdminDataService } from './admin-data.service';

@Injectable({
  providedIn: 'root',
})
export class AdminNotificationsService {
  private readonly adminData = inject(AdminDataService);
  private readonly readIds = new Set<string>();
  private readonly _notifications = signal<AdminNotificationItem[]>([]);
  private readonly _loading = signal(false);
  private readonly _errorMessage = signal<string | null>(null);

  readonly notifications = this._notifications.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly errorMessage = this._errorMessage.asReadonly();
  readonly unreadCount = computed(() =>
    this._notifications().filter((notification) => notification.unread).length,
  );

  async load(): Promise<void> {
    if (this._loading()) {
      return;
    }

    this._loading.set(true);
    this._errorMessage.set(null);

    try {
      const response = await firstValueFrom(this.adminData.getSnapshot());
      if (!isApiSuccessResponse(response)) {
        this._notifications.set([]);
        this._errorMessage.set(response.error);
        return;
      }

      this._notifications.set(buildAdminNotifications(response.data, this.readIds));
    } finally {
      this._loading.set(false);
    }
  }

  markAsRead(notificationId: string): void {
    this.readIds.add(notificationId);
    this._notifications.update((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              unread: false,
            }
          : notification,
      ),
    );
  }

  markAllAsRead(): void {
    const ids = this._notifications().map((notification) => notification.id);
    for (const id of ids) {
      this.readIds.add(id);
    }

    this._notifications.update((current) =>
      current.map((notification) => ({
        ...notification,
        unread: false,
      })),
    );
  }
}
