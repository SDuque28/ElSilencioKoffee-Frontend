import { FormControl, FormGroup } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { passwordMatchValidator } from './password-match.validator';

describe('Prueba Unitaria: passwordMatchValidator', () => {
  it('debería retornar null si las contraseñas coinciden perfectamente', () => {
    // 1. Inicializamos el validador con los nombres exactos de los campos
    const validatorFn = passwordMatchValidator('password', 'confirmPassword');

    // 2. Creamos un formulario simulado con valores idénticos
    const form = new FormGroup({
      password: new FormControl('CafeDeOrigen2026'),
      confirmPassword: new FormControl('CafeDeOrigen2026')
    });

    // 3. Ejecutamos el validador pasándole el formulario completo
    const result = validatorFn(form);

    // Al ser iguales, el resultado esperado es null (sin errores)
    expect(result).toBeNull();
  });

  it('debería retornar un objeto de error si ambas contraseñas tienen texto pero son diferentes', () => {
    const validatorFn = passwordMatchValidator('password', 'confirmPassword');

    // Creamos el formulario con dos textos válidos pero que NO coinciden
    const form = new FormGroup({
      password: new FormControl('Espresso123'),
      confirmPassword: new FormControl('Latte456')
    });

    const result = validatorFn(form);

    // Al ser diferentes y no estar vacías, debe saltar el objeto con el error
    expect(result).toEqual({ passwordMismatch: true });
  });

  it('debería retornar null si alguno de los campos está vacío (según la lógica del validador)', () => {
    const validatorFn = passwordMatchValidator('password', 'confirmPassword');

    // Simulamos que el usuario borró la confirmación o no ha escrito en ella
    const form = new FormGroup({
      password: new FormControl('Espresso123'),
      confirmPassword: new FormControl('')
    });

    const result = validatorFn(form);

    // Tu validador retorna null si falta alguna de las dos contraseñas
    expect(result).toBeNull();
  });
});