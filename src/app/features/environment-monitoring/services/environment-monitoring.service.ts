import { inject, Injectable } from '@angular/core';
import type { Observable } from 'rxjs';

import type { ApiResponse } from '../../../core/models/api-response.model';
import { ApiService } from '../../../core/services/api.service';

export interface EnvironmentSnapshot {
  timestamp: string;
  temperature: number;
  humidity: number;
}

@Injectable({
  providedIn: 'root',
})
export class EnvironmentMonitoringService {
  private readonly api = inject(ApiService);

  getSnapshots(): Observable<ApiResponse<EnvironmentSnapshot[]>> {
    return this.api.get<ApiResponse<EnvironmentSnapshot[]>>('environment/snapshots');
  }
}
