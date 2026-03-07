import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

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
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly controlClasses =
    'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20';

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.authFacade.register(this.form.getRawValue()).subscribe({
      next: () => {
        this.toastService.show({
          title: 'Account created',
          description: 'Welcome to El Silencio Koffee.',
          variant: 'success',
        });

        void this.router.navigateByUrl('/products');
      },
      error: () => {
        this.toastService.show({
          title: 'Registration failed',
          description: 'Please verify your information and retry.',
          variant: 'error',
        });
      },
    });
  }
}
