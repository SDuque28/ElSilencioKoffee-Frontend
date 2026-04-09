import { ChangeDetectionStrategy, Component, EventEmitter, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { RegisterPayload } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Output() formSubmit = new EventEmitter<RegisterPayload>();

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected readonly inputClasses =
    'auth-form__input w-full rounded-2xl border border-[#d6c8bb] bg-[#fffaf4] px-4 py-3 text-sm text-[#2f2219] shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] outline-none transition duration-200 placeholder:text-[#a79282] focus:border-[#6f4e37] focus:ring-4 focus:ring-[#6f4e37]/12';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.form.getRawValue());
  }

  errorFor(controlName: 'name' | 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (!control.invalid || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      switch (controlName) {
        case 'name':
          return 'Full name is required.';
        case 'email':
          return 'Email is required.';
        default:
          return 'Password is required.';
      }
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (control.hasError('minlength')) {
      return controlName === 'name'
        ? 'Use at least 3 characters for your name.'
        : 'Password must contain at least 6 characters.';
    }

    return 'Check this field and try again.';
  }
}
