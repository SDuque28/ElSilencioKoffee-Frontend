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
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, map, of, switchMap, type Observable } from 'rxjs';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { DialogComponent } from '../../../shared/ui/dialog/dialog.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AdminDataTableComponent } from '../components/admin-data-table.component';
import { AdminMetricCardComponent } from '../components/admin-metric-card.component';
import { AdminStatusBadgeComponent } from '../components/admin-status-badge.component';
import { UserDetailPanelComponent } from '../components/user-detail-panel.component';
import type { AdminSnapshotApi } from '../models/admin-api.model';
import type { AdminMetric, AdminOrderRow, AdminUserRow } from '../models/admin-view.model';
import { buildUsersSummary, toOrderRows } from '../services/admin-calculations';
import { AdminDataService } from '../services/admin-data.service';
import { AdminFileExportService } from '../services/admin-file-export.service';
import { AdminViewNavigationService } from '../services/admin-view-navigation.service';

@Component({
  selector: 'app-dashboard-users-page',
  imports: [
    FormsModule,
    DialogComponent,
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
  private readonly toastService = inject(ToastService);
  private readonly fileExportService = inject(AdminFileExportService);
  private readonly navigationService = inject(AdminViewNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = true;
  creatingUser = false;
  updatingUserId: string | number | null = null;
  errorMessage: string | null = null;
  searchTerm = '';
  userModalOpen = false;
  userModalErrorMessage: string | null = null;
  rows: AdminUserRow[] = [];
  orderRows: AdminOrderRow[] = [];
  metrics: AdminMetric[] = [];
  selectedUser: AdminUserRow | null = null;
  readonly createUserForm = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  };

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.searchTerm = params.get('q') ?? '';
      this.cdr.markForCheck();
    });

    this.loadUsersData();
  }

  private loadUsersData(): void {
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

  openCreateUserModal(): void {
    this.userModalErrorMessage = null;
    this.userModalOpen = true;
  }

  closeCreateUserModal(): void {
    if (this.creatingUser) {
      return;
    }

    this.userModalOpen = false;
    this.userModalErrorMessage = null;
    this.resetCreateUserForm();
  }

  createUser(): void {
    if (this.creatingUser) {
      return;
    }

    if (!this.createUserForm.username.trim() || !this.createUserForm.email.trim() || !this.createUserForm.password) {
      this.userModalErrorMessage = 'Username, email, and password are required.';
      return;
    }

    if (this.createUserForm.password !== this.createUserForm.confirmPassword) {
      this.userModalErrorMessage = 'Password confirmation does not match.';
      return;
    }

    this.creatingUser = true;
    this.userModalErrorMessage = null;

    this.adminData
      .createUser({
        username: this.createUserForm.username.trim(),
        email: this.createUserForm.email.trim(),
        password: this.createUserForm.password,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.creatingUser = false;

        if (!isApiSuccessResponse(response)) {
          this.userModalErrorMessage = response.error;
          this.cdr.markForCheck();
          return;
        }

        this.closeCreateUserModal();
        this.toastService.show({
          title: 'User created',
          description: 'The new customer account has been created successfully.',
          variant: 'success',
        });
        this.reloadUsers();
      });
  }

  toggleUserStatus(user: AdminUserRow): void {
    if (this.updatingUserId) {
      return;
    }

    this.updatingUserId = user.id;

    this.adminData
      .updateUser(user.id, {
        activo: user.statusLabel !== 'Active',
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((response) => {
        this.updatingUserId = null;

        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'User update failed',
            description: response.error,
            variant: 'error',
          });
          this.cdr.markForCheck();
          return;
        }

        this.toastService.show({
          title: user.statusLabel === 'Active' ? 'User deactivated' : 'User activated',
          description: `${user.name}'s access status was updated successfully.`,
          variant: 'success',
        });
        this.reloadUsers();
      });
  }

  exportUsers(): void {
    this.fileExportService.downloadCsv(
      'admin-users-report',
      ['Name', 'Email', 'Role', 'Status', 'Total Orders', 'Total Spent'],
      this.filteredUsers.map((user) => [
        user.name,
        user.email,
        user.role,
        user.statusLabel,
        String(user.totalOrders),
        user.totalSpent,
      ]),
    );
    this.toastService.show({
      title: 'Users CSV exported',
      description: 'The current users table was exported successfully.',
      variant: 'success',
    });
  }

  async viewAllOrdersForSelectedUser(): Promise<void> {
    if (!this.selectedUser) {
      return;
    }

    await this.router.navigate(['/dashboard/orders'], {
      queryParams: { q: this.selectedUser.email },
    });
  }

  async openOrder(order: AdminOrderRow): Promise<void> {
    await this.navigationService.navigateToAdminOrder(order.id, {
      q: this.selectedUser?.email ?? null,
    });
  }

  private loadRoles(snapshot: AdminSnapshotApi): Observable<Map<string, string>> {
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

  private reloadUsers(): void {
    this.loading = true;
    this.loadUsersData();
  }

  private resetCreateUserForm(): void {
    this.createUserForm.username = '';
    this.createUserForm.email = '';
    this.createUserForm.password = '';
    this.createUserForm.confirmPassword = '';
  }
}
