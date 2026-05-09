import { Injectable } from '@angular/core';
import { firstValueFrom, forkJoin, map, of, type Observable } from 'rxjs';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import type { AdminDashboardDateFilterState, AdminDashboardReportData } from '../models/admin-view.model';
import { buildCompleteAdminProjectReport } from './admin-project-report';
import { AdminDashboardReportService } from './admin-dashboard-report.service';
import { AdminDataService } from './admin-data.service';

@Injectable({
  providedIn: 'root',
})
export class AdminProjectReportService {
  constructor(
    private readonly adminData: AdminDataService,
    private readonly pdfReportService: AdminDashboardReportService,
  ) {}

  async exportCompleteProjectReport(options?: {
    activeFilter?: AdminDashboardDateFilterState | null;
  }): Promise<void> {
    const report = await this.buildCompleteProjectReport(options);
    await this.pdfReportService.exportReport(report);
  }

  async buildCompleteProjectReport(options?: {
    activeFilter?: AdminDashboardDateFilterState | null;
  }): Promise<AdminDashboardReportData> {
    const response = await firstValueFrom(this.adminData.getSnapshot());
    if (!isApiSuccessResponse(response)) {
      throw new Error(response.error);
    }

    const rolesByUserId = await firstValueFrom(this.loadRolesMap(response.data.users));

    return buildCompleteAdminProjectReport(response.data, rolesByUserId, {
      activeFilterLabel: options?.activeFilter?.label ?? null,
      activeFilterDescription: options?.activeFilter?.description ?? null,
    });
  }

  private loadRolesMap(
    users: Array<{
      id: string | number;
    }>,
  ): Observable<Map<string, string>> {
    if (users.length === 0) {
      return of(new Map<string, string>());
    }

    return forkJoin(
      users.map((user) =>
        this.adminData.getUserRoles(user.id).pipe(
          map((response) => ({
            userId: String(user.id),
            role: isApiSuccessResponse(response) ? (response.data[0]?.rolNombre ?? 'N/A') : 'N/A',
          })),
        ),
      ),
    ).pipe(map((entries) => new Map(entries.map((entry) => [entry.userId, entry.role]))));
  }
}
