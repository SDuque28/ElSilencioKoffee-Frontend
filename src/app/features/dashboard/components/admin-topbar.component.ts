import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { Bell, Download, LucideAngularModule, Search } from 'lucide-angular';
import { filter } from 'rxjs';

import { ClickOutsideDirective } from '../../../shared/directives/click-outside.directive';
import type { AdminNotificationItem } from '../models/admin-view.model';
import { AdminNotificationsService } from '../services/admin-notifications.service';
import { AdminProjectReportService } from '../services/admin-project-report.service';
import { AdminViewNavigationService } from '../services/admin-view-navigation.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-admin-topbar',
  imports: [LucideAngularModule, ClickOutsideDirective],
  styleUrl: './admin-topbar.component.css',
  template: `
    <header class="sticky top-0 z-20 border-b border-white/10 bg-[#0f0f10]/95 backdrop-blur">
      <div class="flex h-16 items-center gap-4 px-4 lg:px-6">
        <div class="relative max-w-xl flex-1">
          <lucide-icon [img]="icons.search" class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="search"
            placeholder="Search orders, roast profiles, or customers..."
            class="h-9 w-full rounded-md border border-white/10 bg-white/[0.05] pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-[#f97316]/50"
          />
        </div>

        <div class="relative" appClickOutside (appClickOutside)="closeNotifications()">
          <button
            data-cy="admin-topbar-bell"
            type="button"
            class="relative grid h-9 w-9 place-items-center rounded-md border border-white/10 text-zinc-400 hover:text-white"
            [attr.aria-expanded]="notificationsOpen()"
            [attr.aria-label]="unreadCount() > 0 ? unreadCount() + ' unread notifications' : 'Notifications'"
            (click)="toggleNotifications()"
          >
            <lucide-icon [img]="icons.bell" class="h-4 w-4" />
            @if (unreadCount() > 0) {
              <span class="absolute right-1.5 top-1.5 inline-flex min-h-2 min-w-2 rounded-full bg-[#f97316] px-1 text-[9px] font-semibold text-black">
                {{ unreadCount() > 9 ? '9+' : unreadCount() }}
              </span>
            }
          </button>

          @if (notificationsOpen()) {
            <section
              data-cy="admin-topbar-notification-panel"
              class="absolute right-0 z-30 mt-2 w-[22rem] overflow-hidden rounded-xl border border-white/10 bg-[#171719] shadow-2xl shadow-black/40"
            >
              <div class="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-3">
                <div>
                  <h2 class="text-sm font-semibold text-white">Notifications</h2>
                  <p class="mt-1 text-xs text-zinc-500">Recent admin activity and project alerts.</p>
                </div>
                @if (unreadCount() > 0) {
                  <button
                    type="button"
                    class="text-[11px] font-semibold text-[#f97316]"
                    (click)="markAllAsRead()"
                  >
                    Mark all read
                  </button>
                }
              </div>

              @if (notificationsService.loading()) {
                <div class="px-4 py-6 text-sm text-zinc-400">Loading notifications...</div>
              } @else if (notificationsService.errorMessage()) {
                <div class="px-4 py-6 text-sm text-rose-200">
                  {{ notificationsService.errorMessage() }}
                </div>
              } @else if (notifications().length === 0) {
                <div data-cy="admin-topbar-notification-empty" class="px-4 py-6 text-sm text-zinc-400">
                  No notifications available right now.
                </div>
              } @else {
                <ul class="admin-topbar__notification-list max-h-[24rem] divide-y divide-white/5 overflow-y-auto">
                  @for (notification of notifications(); track notification.id) {
                    <li>
                      <button
                        data-cy="admin-topbar-notification-item"
                        type="button"
                        [class]="
                          notification.unread
                            ? 'flex w-full items-start gap-3 bg-white/[0.03] px-4 py-3 text-left transition hover:bg-white/[0.05]'
                            : 'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]'
                        "
                        (click)="openNotification(notification)"
                      >
                        <span
                          class="mt-1 inline-flex h-2.5 w-2.5 rounded-full"
                          [class.bg-emerald-400]="notification.tone === 'success'"
                          [class.bg-amber-400]="notification.tone === 'warning'"
                          [class.bg-rose-400]="notification.tone === 'danger'"
                          [class.bg-sky-400]="notification.tone === 'info'"
                          [class.bg-zinc-400]="notification.tone === 'neutral'"
                        ></span>
                        <span class="min-w-0 flex-1">
                          <span class="flex items-start justify-between gap-3">
                            <span class="text-sm font-medium" [class.text-white]="notification.unread" [class.text-zinc-300]="!notification.unread">
                              {{ notification.title }}
                            </span>
                            <span class="shrink-0 text-[11px] text-zinc-500">
                              {{ notification.relativeTime }}
                            </span>
                          </span>
                          <span class="mt-1 block text-xs leading-5 text-zinc-500">
                            {{ notification.description }}
                          </span>
                        </span>
                      </button>
                    </li>
                  }
                </ul>
              }
            </section>
          }
        </div>

        <button
          data-cy="admin-topbar-roastery-view"
          type="button"
          class="hidden rounded-md border border-white/10 px-3 py-2 text-xs text-zinc-300 transition hover:border-white/20 hover:bg-white/[0.04] sm:inline-flex"
          (click)="goToRoasteryView()"
        >
          Roastery View
        </button>
        <button
          data-cy="admin-topbar-export-report"
          type="button"
          class="hidden items-center gap-2 rounded-md bg-[#f97316] px-3 py-2 text-xs font-semibold text-black transition hover:bg-[#fb923c] disabled:cursor-not-allowed disabled:opacity-70 sm:inline-flex"
          [disabled]="exporting()"
          (click)="exportReports()"
        >
          <lucide-icon [img]="icons.download" class="h-4 w-4" />
          {{ exporting() ? 'Exporting...' : 'Export Reports' }}
        </button>
      </div>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTopbarComponent {
  readonly notificationsService = inject(AdminNotificationsService);
  private readonly reportService = inject(AdminProjectReportService);
  private readonly navigationService = inject(AdminViewNavigationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly icons = {
    bell: Bell,
    download: Download,
    search: Search,
  };

  readonly notificationsOpen = signal(false);
  readonly exporting = signal(false);
  readonly notifications = this.notificationsService.notifications;
  readonly unreadCount = computed(() => this.notificationsService.unreadCount());

  constructor() {
    void this.notificationsService.load();

    this.router.events
      .pipe(
        filter((event): event is NavigationStart => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.notificationsOpen.set(false);
      });
  }

  toggleNotifications(): void {
    const nextOpenState = !this.notificationsOpen();
    this.notificationsOpen.set(nextOpenState);

    if (nextOpenState && this.notifications().length === 0 && !this.notificationsService.loading()) {
      void this.notificationsService.load();
    }
  }

  closeNotifications(): void {
    this.notificationsOpen.set(false);
  }

  markAllAsRead(): void {
    this.notificationsService.markAllAsRead();
  }

  async openNotification(notification: AdminNotificationItem): Promise<void> {
    this.notificationsService.markAsRead(notification.id);
    this.closeNotifications();
    await this.navigationService.navigateFromNotification(notification);
  }

  async goToRoasteryView(): Promise<void> {
    await this.navigationService.navigateToRoasteryView();
  }

  async exportReports(): Promise<void> {
    if (this.exporting()) {
      return;
    }

    this.exporting.set(true);

    try {
      await this.reportService.exportCompleteProjectReport();
      this.toastService.show({
        title: 'Report generated',
        description: 'The complete admin project report PDF has been downloaded.',
        variant: 'success',
      });
    } catch (error) {
      this.toastService.show({
        title: 'Report export failed',
        description: error instanceof Error ? error.message : 'Unexpected error generating the report.',
        variant: 'error',
      });
    } finally {
      this.exporting.set(false);
    }
  }
}
