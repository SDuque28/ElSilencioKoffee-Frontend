import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { Coffee, LucideAngularModule } from 'lucide-angular';

import type { LoginRequest, RegisterRequest } from '../../../core/models/auth.model';
import { isApiSuccessResponse } from '../../../core/models/api-response.model';
import { ToastService } from '../../../shared/ui/toast/toast.service';
import { AuthFacadeService } from '../services/auth-facade.service';
import { LoginFormComponent } from './login-form.component';
import { RegisterFormComponent } from './register-form.component';

type AuthMode = 'login' | 'register';

@Component({
  selector: 'app-auth-container',
  imports: [LoginFormComponent, RegisterFormComponent, LucideAngularModule, RouterLink],
  templateUrl: './auth-container.component.html',
  styleUrl: './auth-container.component.css',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthContainerComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authFacade = inject(AuthFacadeService);
  private readonly toastService = inject(ToastService);

  readonly isLoginMode = signal(
    ((this.route.snapshot.data['mode'] as AuthMode | undefined) ?? 'login') === 'login',
  );
  readonly loginPending = signal(false);
  readonly registerPending = signal(false);
  readonly loginError = signal<string | null>(null);
  readonly registerError = signal<string | null>(null);
  protected readonly icons = {
    coffee: Coffee,
  };

  readonly loginVisual =
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1400&q=80';
  readonly registerVisual =
    'https://images.unsplash.com/photo-1447933601403-0c6688de566e?auto=format&fit=crop&w=1400&q=80';

  setMode(mode: AuthMode): void {
    this.isLoginMode.set(mode === 'login');
  }

  onLogin(payload: LoginRequest): void {
    this.loginError.set(null);
    this.loginPending.set(true);

    this.authFacade
      .login(payload)
      .pipe(finalize(() => this.loginPending.set(false)))
      .subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.loginError.set(response.error);
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
        this.loginError.set('No se pudo conectar con el servidor.');
        this.toastService.show({
          title: 'No fue posible iniciar sesion',
          description: 'No se pudo conectar con el servidor.',
          variant: 'error',
        });
      },
    });
  }

  onRegister(payload: RegisterRequest): void {
    this.registerError.set(null);
    this.registerPending.set(true);

    this.authFacade
      .register(payload)
      .pipe(finalize(() => this.registerPending.set(false)))
      .subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.registerError.set(response.error);
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

        void this.router.navigateByUrl('/products');
      },
      error: () => {
        this.registerError.set('No se pudo conectar con el servidor.');
        this.toastService.show({
          title: 'No fue posible crear la cuenta',
          description: 'No se pudo conectar con el servidor.',
          variant: 'error',
        });
      },
    });
  }

  get loginVisualStyle(): string {
    return `linear-gradient(180deg, rgba(35, 23, 16, 0.2), rgba(35, 23, 16, 0.72)), url('${this.loginVisual}')`;
  }

  get registerVisualStyle(): string {
    return `linear-gradient(180deg, rgba(35, 23, 16, 0.18), rgba(35, 23, 16, 0.74)), url('${this.registerVisual}')`;
  }
}
