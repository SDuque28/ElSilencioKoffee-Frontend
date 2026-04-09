import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import type { LoginRequest } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login-form',
  imports: [ReactiveFormsModule],
  templateUrl: './login-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginFormComponent {
  private readonly formBuilder = inject(FormBuilder);

  @Input() loading = false;
  @Input() serverError: string | null = null;
  @Output() formSubmit = new EventEmitter<LoginRequest>();

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
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

  errorFor(controlName: 'username' | 'password'): string {
    const control = this.form.controls[controlName];

    if (!control.invalid || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) {
      return controlName === 'username' ? 'Username is required.' : 'Password is required.';
    }

    return 'Check this field and try again.';
  }
}
