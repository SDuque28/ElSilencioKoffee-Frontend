import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { AuthFacadeService } from '../services/auth-facade.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule, RouterLink, CardComponent, FormFieldComponent, ButtonComponent],
  templateUrl: './login-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly serverError = signal<string | null>(null);

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  readonly controlClasses =
    'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.authFacade.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.serverError.set(this.getLoginErrorMessage(response.error, response.code));
          return;
        }

        this.toastService.show({
          title: 'Bienvenido de nuevo',
          description: 'La sesion se inicio correctamente.',
          variant: 'success',
        });

        const redirectTo =
          this.route.snapshot.queryParamMap.get('redirectTo') ??
          (this.authFacade.isAdmin() ? '/dashboard' : '/products');
        void this.router.navigateByUrl(redirectTo);
      },
      error: (error: { error?: string; code?: number }) => {
        this.serverError.set(this.getLoginErrorMessage(error.error, error.code));
      },
    });
  }

  private getLoginErrorMessage(errorMessage?: string, errorCode?: number): string {
    if (errorCode === 401) {
      return 'Incorrect username or password.';
    }

    if (
      errorMessage?.includes('Http failure response') ||
      errorMessage?.includes('401 Unauthorized') ||
      errorMessage?.toLowerCase().includes('unauthorized')
    ) {
      return 'Incorrect username or password.';
    }

    return errorMessage ?? 'No se pudo conectar con el servidor.';
  }
}
