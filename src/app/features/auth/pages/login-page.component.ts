import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

    this.authFacade.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'No fue posible iniciar sesion',
            description: response.error,
            variant: 'error',
          });
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
      error: () => {
        this.toastService.show({
          title: 'No fue posible iniciar sesion',
          description: 'No se pudo conectar con el servidor.',
          variant: 'error',
        });
      },
    });
  }
}
