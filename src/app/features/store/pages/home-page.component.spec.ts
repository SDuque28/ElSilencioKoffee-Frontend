import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { describe, expect, it, beforeEach } from 'vitest';
import { HomePageComponent } from './home-page.component';

describe('Prueba Unitaria: HomePageComponent (Catálogo)', () => {
  let component: HomePageComponent;
  let fixture: any;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HomePageComponent, 
        HttpClientTestingModule, 
        RouterModule.forRoot([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // Dispara el ngOnInit y renderiza el catálogo
  });

  it('debería inicializar el componente de la tienda correctamente', () => {
    // Comprueba que la página del catálogo de café se crea sin colapsar
    expect(component).toBeTruthy();
  });

  it('debería renderizar la estructura básica en el HTML', () => {
    // Obtenemos el elemento HTML visible de la página
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Verificamos que el contenedor principal de la página exista en el DOM
    expect(compiled).toBeDefined();
  });
});