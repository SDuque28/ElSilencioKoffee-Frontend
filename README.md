# El Silencio Koffee Frontend

Angular frontend for El Silencio Koffee with live backend integration enabled by default.

## 1. Current Status

- Global mock mode is disabled through `isMockMode = false`
- Frontend services use the real backend for supported flows
- Runtime API URLs remain overrideable through `public/env.js`
- Ecommerce home page is available at `/`

## 2. Tech Stack

- Angular 21
- TypeScript strict mode
- Angular Router + HttpClient
- TailwindCSS
- Chart.js
- lucide-angular
- ESLint + Prettier

## 3. Local Setup

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm start
```

Default URL: `http://localhost:4200`

### Build

```bash
npm run build
```

### Lint and format

```bash
npm run lint
npm run format
```

## 4. Environment Configuration

Environment files live in [`src/environments`](./src/environments):

- `environment.ts`
- `environment.development.ts`
- `environment.production.ts`

Current shared defaults:

```ts
apiUrl: '/api-auth';
authApiUrl: '/api-auth';
isMockMode: false;
debugApiLogging: true;
```

Development uses [`proxy.conf.json`](./proxy.conf.json) to forward `/api-auth` to the Spring Boot backend. Production can override the runtime values through `public/env.js`.

## 5. Architecture Summary

```text
src/app
  core/
    guards/
    interceptors/
    models/
    services/
  features/
    auth/
    cart/
    dashboard/
    environment-monitoring/
    orders/
    production/
    products/
    store/
  layout/
  shared/
```

### Core Layer

- [`ApiService`](./src/app/core/services/api.service.ts) centralizes `get`, `post`, `put`, `patch`, and `delete`
- [`AuthService`](./src/app/core/services/auth.service.ts) manages the persisted authenticated session
- [`authInterceptor`](./src/app/core/interceptors/auth.interceptor.ts) attaches `Authorization` only when a token exists and normalizes HTTP errors
- [`authGuard`](./src/app/core/guards/auth.guard.ts) and [`adminGuard`](./src/app/core/guards/admin.guard.ts) enforce authenticated/admin navigation where required

### Feature Layer

Each feature owns its pages and services. Backend-supported flows use live APIs, and unsupported backend flows should surface empty or error states instead of falling back to fake data.

## 6. API Contract Alignment

The frontend currently expects:

- Base URL: `/api-auth` by default
- Standard success response:

```json
{ "success": true, "data": {}, "message": "OK" }
```

- Standard error response:

```json
{ "success": false, "error": "message", "code": 400 }
```

## 7. Development Notes

- Do not reintroduce mock data into components or feature services
- Keep services aligned with real backend endpoints and response shapes
- Prefer safe fallbacks for unsupported backend fields instead of inventing new client-side mocks
