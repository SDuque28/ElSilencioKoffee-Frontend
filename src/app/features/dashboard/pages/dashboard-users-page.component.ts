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
import { forkJoin, map, of, switchMap } from 'rxjs';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import { UserDetailPanelComponent } from '../components/user-detail-panel.component';
import type { AdminSnapshotApi } from '../models/admin-api.model';
import type { AdminMetric, AdminOrderRow, AdminUserRow } from '../models/admin-view.model';
import { buildUsersSummary, toOrderRows } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';

@Component({
  selector: 'app-dashboard-users-page',
  imports: [
    FormsModule,
    AdminDataTableComponent,
    AdminMetricCardComponent,
    AdminStatusBadgeComponent,
    UserDetailPanelComponent,
  ],
  templateUrl: './dashboard-users-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardUsersPageComponent implements OnInit {
  private readonly adminData = inject(AdminDataService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage: string | null = null;
  searchTerm = '';
  rows: AdminUserRow[] = [];
  orderRows: AdminOrderRow[] = [];
  metrics: AdminMetric[] = [];
  selectedUser: AdminUserRow | null = null;

  ngOnInit(): void {
    this.adminData
      .getSnapshot()
      .pipe(
        switchMap((response) => {
          if (!isApiSuccessResponse(response)) {
            return of({ snapshot: null, rolesByUserId: new Map<string, string>(), error: response.error });
          }

          return this.loadRoles(response.data).pipe(
            map((rolesByUserId) => ({
              snapshot: response.data,
              rolesByUserId,
              error: null,
            })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((result) => {
        this.loading = false;
        if (!result.snapshot) {
          this.errorMessage = result.error;
          this.cdr.markForCheck();
          return;
        }

        const summary = buildUsersSummary(result.snapshot.users, result.snapshot.orders, result.rolesByUserId);
        this.errorMessage = null;
        this.rows = summary.users;
        this.metrics = summary.metrics;
        this.orderRows = toOrderRows(result.snapshot.orders);
        this.selectedUser = this.rows[0] ?? null;
        this.cdr.markForCheck();
      });
  }

  get filteredUsers(): AdminUserRow[] {
    const query = this.searchTerm.trim().toLowerCase();
    if (!query) {
      return this.rows;
    }
    return this.rows.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }

  get selectedUserOrders(): AdminOrderRow[] {
    if (!this.selectedUser) {
      return [];
    }
    return this.orderRows.filter((order) => String(order.source.userId) === String(this.selectedUser?.id));
  }

  selectUser(user: AdminUserRow): void {
    this.selectedUser = user;
  }

  private loadRoles(snapshot: AdminSnapshotApi) {
    if (snapshot.users.length === 0) {
      return of(new Map<string, string>());
    }

    const requests = snapshot.users.map((user) =>
      this.adminData.getUserRoles(user.id).pipe(
        map((response) => ({
          userId: String(user.id),
          role: isApiSuccessResponse(response) ? (response.data[0]?.rolNombre ?? 'N/A') : 'N/A',
        })),
      ),
    );

    return forkJoin(requests).pipe(
      map((roles) => new Map(roles.map((entry) => [entry.userId, entry.role]))),
    );
  }
}
