import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs';
import { Router, RouterLink } from '@angular/router';

import type {
  AuthMessageResponse,
  PasswordRecoveryRequest,
} from '../../../core/models/auth.model';
import {
  isApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
  type ApiSuccessResponse,
} from '../../../core/models/api-response.model';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthFacadeService } from '../services/auth-facade.service';
import { passwordMatchValidator } from '../utils/password-match.validator';

@Component({
  selector: 'app-password-recovery-page',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    CardComponent,
    FormFieldComponent,
    ButtonComponent,
  ],
  templateUrl: './password-recovery-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordRecoveryPageComponent {
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly authFacade: AuthFacadeService = inject(AuthFacadeService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly router: Router = inject(Router);

  readonly loading = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly controlClasses =
    'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  readonly form = this.formBuilder.nonNullable.group(
    {
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
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

    const payload: PasswordRecoveryRequest = this.form.getRawValue();
    const request$: Observable<ApiResponse<AuthMessageResponse>> = this.authFacade.passwordRecovery(
      payload,
    );

    request$
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response: ApiResponse<AuthMessageResponse>) => {
          if (!isApiSuccessResponse(response)) {
            const errorResponse: ApiErrorResponse = response;
            this.serverError.set(errorResponse.error);
            this.toastService.show({
              title: 'Password recovery failed',
              description: errorResponse.error,
              variant: 'error',
            });
            return;
          }

          const successResponse: ApiSuccessResponse<AuthMessageResponse> = response;
          const successMessage: string = successResponse.data.message;

          this.toastService.show({
            title: 'Password updated',
            description: successMessage,
            variant: 'success',
          });
          this.form.reset({
            username: '',
            email: '',
            newPassword: '',
            confirmPassword: '',
          });
          void this.router.navigateByUrl('/login');
        },
        error: () => {
          this.serverError.set('No se pudo conectar con el servidor.');
          this.toastService.show({
            title: 'Password recovery failed',
            description: 'No se pudo conectar con el servidor.',
            variant: 'error',
          });
        },
      });
  }

  errorFor(controlName: 'username' | 'email' | 'newPassword' | 'confirmPassword'): string {
    const control = this.form.controls[controlName];
    const showMismatch = controlName === 'confirmPassword' && this.showPasswordMismatch();

    if (!control.invalid && !showMismatch) {
      return '';
    }

    if (!this.wasInteracted(controlName) && !showMismatch) {
      return '';
    }

    if (control.hasError('required')) {
      switch (controlName) {
        case 'username':
          return 'Username is required.';
        case 'email':
          return 'Email is required.';
        case 'newPassword':
          return 'New password is required.';
        default:
          return 'Confirm password is required.';
      }
    }

    if (control.hasError('email')) {
      return 'Enter a valid email address.';
    }

    if (showMismatch) {
      return 'Passwords do not match.';
    }

    return 'Check this field and try again.';
  }

  private wasInteracted(
    controlName: 'username' | 'email' | 'newPassword' | 'confirmPassword',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.touched || control.dirty;
  }

  private showPasswordMismatch(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return (
      this.form.hasError('passwordMismatch') &&
      (confirmPassword.touched || confirmPassword.dirty)
    );
  }
}
