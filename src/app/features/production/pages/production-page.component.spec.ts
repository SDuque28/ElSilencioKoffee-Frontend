import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, beforeEach } from 'vitest';
import { ProductionPageComponent } from './production-page.component';

describe('Prueba Unitaria: ProductionPageComponent', () => {
  let component: ProductionPageComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProductionPageComponent,
        HttpClientTestingModule
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductionPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear la página de gestión de producción correctamente', () => {
    expect(component).toBeTruthy();
  });
});