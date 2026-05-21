import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { EnvironmentMonitoringService } from './environment-monitoring.service';

describe('Prueba Unitaria: EnvironmentMonitoringService', () => {
  let service: EnvironmentMonitoringService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [EnvironmentMonitoringService]
    });
    service = TestBed.inject(EnvironmentMonitoringService);
  });

  it('debería inicializar el servicio de monitoreo ambiental correctamente', () => {
    expect(service).toBeTruthy();
  });
});