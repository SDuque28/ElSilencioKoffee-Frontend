import { FormControl, FormGroup } from '@angular/forms';

import { passwordMatchValidator } from 'app/features/auth/utils/password-match.validator';

describe('passwordMatchValidator', () => {
  function createForm(password: unknown, confirmation: unknown): FormGroup {
    return new FormGroup(
      {
        password: new FormControl(password),
        confirmation: new FormControl(confirmation),
      },
      {
        validators: [passwordMatchValidator('password', 'confirmation')],
      },
    );
  }

  it('accepts matching passwords', () => {
    const form = createForm('hola1234', 'hola1234');

    expect(form.valid).toBe(true);
    expect(form.errors).toBeNull();
  });

  it('rejects different password values', () => {
    const form = createForm('hola1234', 'otra-clave');

    expect(form.valid).toBe(false);
    expect(form.errors).toEqual({ passwordMismatch: true });
  });

  it('does not block empty or non-string values handled by other validators', () => {
    expect(createForm('', '').errors).toBeNull();
    expect(createForm('hola1234', '').errors).toBeNull();
    expect(createForm(null, 'hola1234').errors).toBeNull();
  });
});
