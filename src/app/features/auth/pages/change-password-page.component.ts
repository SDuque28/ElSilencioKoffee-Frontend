import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthFacadeService } from '../services/auth-facade.service';
import { passwordMatchValidator } from '../utils/password-match.validator';

@Component({
  selector: 'app-change-password-page',
  imports: [
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
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);
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

    this.serverError.set(null);
    this.loading.set(true);

    this.authFacade
      .changePassword(this.form.getRawValue())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          if (!isApiSuccessResponse(response)) {
            this.serverError.set(response.error);
            this.toastService.show({
              title: 'Password change failed',
              description: response.error,
              variant: 'error',
            });
            return;
          }

          this.toastService.show({
            title: 'Password changed',
            description: response.data.message,
            variant: 'success',
          });
          this.form.reset({
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
          });
          void this.router.navigateByUrl('/products');
        },
        error: () => {
          this.serverError.set('No se pudo conectar con el servidor.');
          this.toastService.show({
            title: 'Password change failed',
            description: 'No se pudo conectar con el servidor.',
            variant: 'error',
          });
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
}
