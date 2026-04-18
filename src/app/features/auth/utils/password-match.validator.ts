import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';

export function passwordMatchValidator(
  passwordField: string,
  confirmPasswordField: string,
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const passwordControl = control.get(passwordField);
    const confirmPasswordControl = control.get(confirmPasswordField);
    const password = passwordControl?.value;
    const confirmPassword = confirmPasswordControl?.value;

    if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return null;
    }

    if (!password || !confirmPassword) {
      return null;
    }

    return password === confirmPassword ? null : { passwordMismatch: true };
  };
}
