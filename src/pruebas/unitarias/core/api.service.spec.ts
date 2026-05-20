import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { ApiService } from 'app/core/services/api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('builds API requests with normalized URL and query params', async () => {
    const responsePromise = firstValueFrom(
      service.get<{ id: number }>('products', {
        baseUrl: 'https://api.example.test/',
        params: {
          page: 1,
          active: true,
          skipped: null,
        },
      }),
    );

    const request = httpMock.expectOne(
      (req) =>
        req.url === 'https://api.example.test/products' &&
        req.params.get('page') === '1' &&
        req.params.get('active') === 'true' &&
        !req.params.has('skipped'),
    );

    request.flush({ id: 10 });

    await expect(responsePromise).resolves.toEqual({
      success: true,
      data: { id: 10 },
      message: 'Request completed successfully.',
    });
  });

  it('preserves backend success envelopes without remapping data', async () => {
    const responsePromise = firstValueFrom(service.post('orders', { total: 26 }));
    const request = httpMock.expectOne('/api-auth/orders');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ total: 26 });

    request.flush({
      success: true,
      data: { orderId: 45 },
      message: 'created',
    });

    await expect(responsePromise).resolves.toEqual({
      success: true,
      data: { orderId: 45 },
      message: 'created',
    });
  });

  it('normalizes HTTP errors into API error responses', async () => {
    const responsePromise = firstValueFrom(service.get('products/404'));
    const request = httpMock.expectOne('/api-auth/products/404');

    request.flush({ message: 'Product not found' }, { status: 404, statusText: 'Not Found' });

    await expect(responsePromise).resolves.toEqual({
      success: false,
      error: 'Product not found',
      code: 404,
    });
  });

  it('normalizes network failures with a user-facing connection error', async () => {
    const responsePromise = firstValueFrom(service.get('health'));
    const request = httpMock.expectOne('/api-auth/health');

    request.error(new ProgressEvent('error'), { status: 0, statusText: 'Unknown Error' });

    await expect(responsePromise).resolves.toEqual({
      success: false,
      error: 'No se pudo conectar con el servidor.',
      code: 0,
    });
  });

});
