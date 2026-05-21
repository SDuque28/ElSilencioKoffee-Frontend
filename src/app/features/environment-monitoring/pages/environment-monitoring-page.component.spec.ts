import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { EnvironmentMonitoringPageComponent } from './environment-monitoring-page.component';

describe('Prueba Unitaria: EnvironmentMonitoringPageComponent', () => {
  let component: EnvironmentMonitoringPageComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EnvironmentMonitoringPageComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EnvironmentMonitoringPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear la página de monitoreo ambiental correctamente', () => {
    expect(component).toBeTruthy();
  });
});