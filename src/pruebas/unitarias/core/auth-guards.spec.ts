import { TestBed } from '@angular/core/testing';
import { Router, type RouterStateSnapshot } from '@angular/router';

import { adminGuard } from 'app/core/guards/admin.guard';
import { authGuard } from 'app/core/guards/auth.guard';
import { guestGuard } from 'app/core/guards/guest.guard';
import { AuthService } from 'app/core/services/auth.service';

describe('auth route guards', () => {
  let authService: {
    isAuthenticated: ReturnType<typeof vi.fn>;
    isAdmin: ReturnType<typeof vi.fn>;
  };
  let router: {
    createUrlTree: ReturnType<typeof vi.fn>;
  };

  const state = { url: '/checkout' } as RouterStateSnapshot;

  beforeEach(() => {
    authService = {
      isAuthenticated: vi.fn(),
      isAdmin: vi.fn(),
    };
    router = {
      createUrlTree: vi.fn((commands: unknown[], extras?: unknown) => ({
        commands,
        extras,
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: router },
      ],
    });
  });

  it('allows authenticated users through authGuard', () => {
    authService.isAuthenticated.mockReturnValue(true);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, state));

    expect(result).toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects guests to login and preserves the requested URL', () => {
    authService.isAuthenticated.mockReturnValue(false);

    const result = TestBed.runInInjectionContext(() => authGuard({} as never, state));

    expect(result).toEqual({
      commands: ['/login'],
      extras: { queryParams: { redirectTo: '/checkout' } },
    });
  });

  it('keeps guests on guest-only routes and sends logged users to their landing page', () => {
    authService.isAuthenticated.mockReturnValue(false);

    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, state))).toBe(true);

    authService.isAuthenticated.mockReturnValue(true);
    authService.isAdmin.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, state))).toEqual({
      commands: ['/products'],
      extras: undefined,
    });

    authService.isAdmin.mockReturnValue(true);
    expect(TestBed.runInInjectionContext(() => guestGuard({} as never, state))).toEqual({
      commands: ['/dashboard'],
      extras: undefined,
    });
  });

  it('allows only administrators through adminGuard', () => {
    authService.isAdmin.mockReturnValue(true);

    expect(TestBed.runInInjectionContext(() => adminGuard({} as never, state))).toBe(true);

    authService.isAdmin.mockReturnValue(false);
    expect(TestBed.runInInjectionContext(() => adminGuard({} as never, state))).toEqual({
      commands: ['/products'],
      extras: undefined,
    });
  });
});
