import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { authInterceptor } from 'app/core/interceptors/auth.interceptor';
import { AuthService } from 'app/core/services/auth.service';
import { ApiService } from 'app/core/services/api.service';

describe('authInterceptor', () => {
  let api: ApiService;
  let httpMock: HttpTestingController;
  let authService: {
    getToken: ReturnType<typeof vi.fn>;
    getAuthHeaders: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    authService = {
      getToken: vi.fn(() => 'test-token'),
      getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test-token' })),
    };

    TestBed.configureTestingModule({
      providers: [
        ApiService,
        { provide: AuthService, useValue: authService },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    api = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('adds bearer token and JSON content type to known API mutation requests', async () => {
    const responsePromise = firstValueFrom(api.post('cart/items', { productId: 1 }));
    const request = httpMock.expectOne('/api-auth/cart/items');

    expect(request.request.headers.get('Authorization')).toBe('Bearer test-token');
    expect(request.request.headers.get('Content-Type')).toBe('application/json');

    request.flush({ success: true, data: { id: 1 }, message: 'ok' });

    await expect(responsePromise).resolves.toMatchObject({ success: true });
  });

  it('does not add authentication headers to external URLs', async () => {
    const responsePromise = firstValueFrom(
      api.get('https://cdn.example.test/catalog.json', {
        baseUrl: 'https://ignored.example.test',
      }),
    );
    const request = httpMock.expectOne('https://cdn.example.test/catalog.json');

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({ items: [] });

    await expect(responsePromise).resolves.toMatchObject({ success: true });
  });

  it('normalizes HTTP errors before they reach ApiService error handling', async () => {
    const responsePromise = firstValueFrom(api.get('secure-area'));
    const request = httpMock.expectOne('/api-auth/secure-area');

    request.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    await expect(responsePromise).resolves.toEqual({
      success: false,
      error: 'Unauthorized',
      code: 401,
    });
  });
});
