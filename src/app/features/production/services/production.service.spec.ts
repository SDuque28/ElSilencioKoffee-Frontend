import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ProductionService } from './production.service';

describe('Prueba Unitaria: ProductionService', () => {
  let service: ProductionService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ProductionService]
    });
    service = TestBed.inject(ProductionService);
  });

  it('debería inicializar el servicio de producción correctamente', () => {
    expect(service).toBeTruthy();
  });
});