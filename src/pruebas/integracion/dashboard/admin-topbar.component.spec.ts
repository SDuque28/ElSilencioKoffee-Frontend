import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import { Subject } from 'rxjs';

import type { AdminNotificationItem } from 'app/features/dashboard/models/admin-view.model';
import { AdminTopbarComponent } from 'app/features/dashboard/components/admin-topbar.component';
import { AdminNotificationsService } from 'app/features/dashboard/services/admin-notifications.service';
import { AdminProjectReportService } from 'app/features/dashboard/services/admin-project-report.service';
import { AdminViewNavigationService } from 'app/features/dashboard/services/admin-view-navigation.service';
import { ToastService } from 'app/shared/ui/toast/toast.service';

describe('AdminTopbarComponent', () => {
  it('opens notifications, closes on navigation, and triggers the header actions', async () => {
    const routerEvents = new Subject<NavigationStart>();
    const notifications = signal<AdminNotificationItem[]>([
      {
        id: 'order-10',
        title: 'New order #COF-0010',
        description: 'Camila placed a new order.',
        category: 'order',
        createdAt: '2026-05-08T10:00:00',
        relativeTime: '1 hr ago',
        route: '/dashboard/orders',
        tone: 'success',
        unread: true,
      },
    ]);

    const notificationsService = {
      notifications,
      loading: signal(false),
      errorMessage: signal<string | null>(null),
      unreadCount: signal(1),
      load: vi.fn().mockResolvedValue(undefined),
      markAllAsRead: vi.fn(),
      markAsRead: vi.fn(),
    };
    const reportService = {
      exportCompleteProjectReport: vi.fn().mockResolvedValue(undefined),
    };
    const navigationService = {
      navigateToRoasteryView: vi.fn().mockResolvedValue(true),
      navigateFromNotification: vi.fn().mockResolvedValue(true),
    };
    const toastService = {
      show: vi.fn(),
      messages: signal([]),
    };

    await TestBed.configureTestingModule({
      imports: [AdminTopbarComponent],
      providers: [
        {
          provide: AdminNotificationsService,
          useValue: notificationsService,
        },
        {
          provide: AdminProjectReportService,
          useValue: reportService,
        },
        {
          provide: AdminViewNavigationService,
          useValue: navigationService,
        },
        {
          provide: ToastService,
          useValue: toastService,
        },
        {
          provide: Router,
          useValue: {
            events: routerEvents.asObservable(),
          },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AdminTopbarComponent);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;

    (nativeElement.querySelector('[data-cy="admin-topbar-bell"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-cy="admin-topbar-notification-panel"]')).not.toBeNull();

    (nativeElement.querySelector('[data-cy="admin-topbar-export-report"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(reportService.exportCompleteProjectReport).toHaveBeenCalledTimes(1);
    expect(toastService.show).toHaveBeenCalled();

    (nativeElement.querySelector('[data-cy="admin-topbar-roastery-view"]') as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(navigationService.navigateToRoasteryView).toHaveBeenCalledTimes(1);

    (nativeElement.querySelector('[data-cy="admin-topbar-bell"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    (
      nativeElement.querySelector('[data-cy="admin-topbar-notification-item"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(notificationsService.markAsRead).toHaveBeenCalledWith('order-10');
    expect(navigationService.navigateFromNotification).toHaveBeenCalledTimes(1);
    expect(nativeElement.querySelector('[data-cy="admin-topbar-notification-panel"]')).toBeNull();

    routerEvents.next(new NavigationStart(1, '/dashboard/orders'));
    fixture.detectChanges();

    expect(nativeElement.querySelector('[data-cy="admin-topbar-notification-panel"]')).toBeNull();
  });
});
