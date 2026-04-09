import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { RegisterRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule],
  templateUrl: './register-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Input() loading = false;
  @Input() serverError: string | null = null;
  @Output() formSubmit = new EventEmitter<RegisterRequest>();

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
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

  errorFor(controlName: 'username' | 'email' | 'password'): string {
    const control = this.form.controls[controlName];

    if (!control.invalid || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      switch (controlName) {
        case 'username':
          return 'Username is required.';
        case 'email':
          return 'Email is required.';
        default:
          return 'Password is required.';
      }
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    return 'Check this field and try again.';
  }
}
