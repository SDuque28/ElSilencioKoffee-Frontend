import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Coffee, LucideAngularModule } from 'lucide-angular';

import type { LoginPayload, RegisterPayload } from '../../../core/models/auth.model';
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

  onLogin(payload: LoginPayload): void {
    this.authFacade.login(payload).subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Authentication failed',
            description: response.error,
            variant: 'error',
          });
          return;
        }

        this.toastService.show({
          title: 'Welcome back',
          description: 'Authentication completed successfully.',
          variant: 'success',
        });

        const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') ?? '/products';
        void this.router.navigateByUrl(redirectTo);
      },
      error: () => {
        this.toastService.show({
          title: 'Authentication failed',
          description: 'Check your credentials and try again.',
          variant: 'error',
        });
      },
    });
  }

  onRegister(payload: RegisterPayload): void {
    this.authFacade.register(payload).subscribe({
      next: (response) => {
        if (!isApiSuccessResponse(response)) {
          this.toastService.show({
            title: 'Registration failed',
            description: response.error,
            variant: 'error',
          });
          return;
        }

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

  get loginVisualStyle(): string {
    return `linear-gradient(180deg, rgba(35, 23, 16, 0.2), rgba(35, 23, 16, 0.72)), url('${this.loginVisual}')`;
  }

  get registerVisualStyle(): string {
    return `linear-gradient(180deg, rgba(35, 23, 16, 0.18), rgba(35, 23, 16, 0.74)), url('${this.registerVisual}')`;
  }
}
