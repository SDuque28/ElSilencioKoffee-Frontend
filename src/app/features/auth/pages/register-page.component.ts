import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { CartStateService } from '../../cart/services/cart-state.service';
import { AuthFacadeService } from '../services/auth-facade.service';
import { ButtonComponent } from '../../../shared/ui/button/button.component';
import { CardComponent } from '../../../shared/ui/card/card.component';
import { FormFieldComponent } from '../../../shared/ui/form-field/form-field.component';
import { ToastService } from '../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, CardComponent, FormFieldComponent, ButtonComponent],
  templateUrl: './register-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly cartState = inject(CartStateService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    username: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly controlClasses =
    'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authFacade.register(this.form.getRawValue()).subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'No fue posible crear la cuenta',
            description: response.error,
            variant: 'error',
          });
          return;
        }

        this.toastService.show({
          title: 'Cuenta creada',
          description: 'Tu usuario quedo autenticado correctamente.',
          variant: 'success',
        });

        this.cartState.loadCart().subscribe({
          next: () => {
            void this.router.navigateByUrl('/products');
          },
          error: () => {
            void this.router.navigateByUrl('/products');
          },
        });
      },
      error: () => {
        this.toastService.show({
          title: 'No fue posible crear la cuenta',
          description: 'No se pudo conectar con el servidor.',
          variant: 'error',
        });
      },
    });
  }
}
