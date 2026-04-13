import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { AuthFacadeService } from '../services/auth-facade.service';
import { passwordMatchValidator } from '../utils/password-match.validator';

@Component({
  selector: 'app-change-password-page',
  imports: [
    NgClass,
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    FormFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './change-password-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);

  readonly loading = signal(false);
  readonly feedbackMessage = signal<string | null>(null);
  readonly feedbackVariant = signal<'info' | 'success' | 'error' | null>(null);
  readonly controlClasses =
    'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  readonly form = this.formBuilder.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [passwordMatchValidator('newPassword', 'confirmPassword')],
    },
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.feedbackVariant.set('info');
    this.feedbackMessage.set('Updating your password...');
    this.loading.set(true);

    this.authFacade
      .changePassword(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (!isApiSuccessResponse(response)) {
            this.feedbackVariant.set('error');
            this.feedbackMessage.set(response.error);
            return;
          }

          this.feedbackVariant.set('success');
          this.feedbackMessage.set(response.data.message);
          this.form.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
        },
        error: () => {
          this.feedbackVariant.set('error');
          this.feedbackMessage.set('No se pudo conectar con el servidor.');
        },
      });
  }

  errorFor(controlName: 'currentPassword' | 'newPassword' | 'confirmPassword'): string {
    const control = this.form.controls[controlName];

    if (!control.invalid && !(controlName === 'confirmPassword' && this.showPasswordMismatch())) {
      return '';
    }

    if (!(control.touched || control.dirty) && !this.showPasswordMismatch()) {
      return '';
    }

    if (control.hasError('required')) {
      switch (controlName) {
        case 'currentPassword':
          return 'Current password is required.';
        case 'newPassword':
          return 'New password is required.';
        default:
          return 'Confirm password is required.';
      }
    }

    if (controlName === 'confirmPassword' && this.showPasswordMismatch()) {
      return 'Passwords do not match.';
    }

    return 'Check this field and try again.';
  }

  private showPasswordMismatch(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return this.form.hasError('passwordMismatch') && (confirmPassword.touched || confirmPassword.dirty);
  }

  feedbackClasses(): string {
    switch (this.feedbackVariant()) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-900';
      case 'error':
        return 'border-rose-200 bg-rose-50 text-rose-900';
      default:
        return 'border-amber-200 bg-amber-50 text-amber-900';
    }
  }
}
