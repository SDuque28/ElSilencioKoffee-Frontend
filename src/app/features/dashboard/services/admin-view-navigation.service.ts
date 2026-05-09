import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import type { AdminNotificationItem } from '../models/admin-view.model';

@Injectable({
  providedIn: 'root',
})
export class AdminViewNavigationService {
  constructor(private readonly router: Router) {}

  navigateToRoasteryView(): Promise<boolean> {
    return this.router.navigateByUrl('/');
  }

  navigateFromNotification(notification: AdminNotificationItem): Promise<boolean> {
    return this.router.navigateByUrl(notification.route);
  }
}
