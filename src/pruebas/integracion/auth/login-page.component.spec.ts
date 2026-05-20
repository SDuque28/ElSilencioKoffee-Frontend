import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';

import { LoginPageComponent } from 'app/features/auth/pages/login-page.component';
import { AuthFacadeService } from 'app/features/auth/services/auth-facade.service';
import { CartStateService } from 'app/features/cart/services/cart-state.service';
import { ProductModalService } from 'app/features/products/services/product-modal.service';
import { ToastService } from 'app/shared/ui/toast/toast.service';

describe('LoginPageComponent integration', () => {
  let authFacade: {
    login: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
  };
  let cartState: {
    closeDrawer: ReturnType<typeof vi.fn>;
    loadCart: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigateByUrl: ReturnType<typeof vi.fn>;
  };
  let toastService: {
    show: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authFacade = {
      login: vi.fn(),
      isAdmin: vi.fn(() => false),
    };
    cartState = {
      closeDrawer: vi.fn(),
      loadCart: vi.fn(() => of({ success: true, data: { items: [] }, message: 'ok' })),
    };
    router = {
      navigateByUrl: vi.fn(() => Promise.resolve(true)),
    };
    toastService = {
      show: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [LoginPageComponent],
      providers: [
        { provide: AuthFacadeService, useValue: authFacade },
        { provide: CartStateService, useValue: cartState },
        { provide: ProductModalService, useValue: { close: vi.fn() } },
        { provide: ToastService, useValue: toastService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();
  });

  it('marks required fields and avoids login calls when the form is invalid', () => {
    const fixture = TestBed.createComponent(LoginPageComponent);

    fixture.componentInstance.submit();

    expect(authFacade.login).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.controls.username.touched).toBe(true);
    expect(fixture.componentInstance.form.controls.password.touched).toBe(true);
  });

  it('logs in, closes transient UI, refreshes cart, and redirects regular users to products', async () => {
    authFacade.login.mockReturnValue(
      of({
        success: true,
        data: {
          token: 'fake-token',
          username: 'tester',
          email: 'tester@example.com',
          roles: ['ROLE_USER'],
          user: {
            id: 1,
            username: 'tester',
            name: 'tester',
            email: 'tester@example.com',
            roles: ['ROLE_USER'],
            role: 'USER',
          },
        },
        message: 'ok',
      }),
    );

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.componentInstance.form.setValue({
      username: 'tester',
      password: 'hola1234',
    });

    fixture.componentInstance.submit();
    await fixture.whenStable();

    expect(authFacade.login).toHaveBeenCalledWith({
      username: 'tester',
      password: 'hola1234',
    });
    expect(toastService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'success',
      }),
    );
    expect(cartState.closeDrawer).toHaveBeenCalled();
    expect(cartState.loadCart).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('shows a safe authentication error without redirecting on failed login', () => {
    authFacade.login.mockReturnValue(
      of({
        success: false,
        error: 'Unauthorized',
        code: 401,
      }),
    );

    const fixture = TestBed.createComponent(LoginPageComponent);
    fixture.componentInstance.form.setValue({
      username: 'tester',
      password: 'bad-password',
    });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.serverError()).toBe('Incorrect username or password.');
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
