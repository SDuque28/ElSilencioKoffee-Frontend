# El Silencio Koffee Frontend

Angular frontend for El Silencio Koffee in `PRE-BACKEND STABILIZATION` mode. The application is fully navigable with structured mocks aligned to the API contract defined in [`documentation/routes.md`](./documentation/routes.md).

## 1. Current Status

- Frontend works standalone without a real backend connection
- Global mock mode is enabled through `isMockMode = true`
- All frontend routes are accessible
- Services are aligned with the documented API contract
- Mocks live in services, not in components

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

Current shared configuration:

```ts
apiUrl: 'https://elsilenciokofee.com/api/v1';
isMockMode: true;
debugApiLogging: true;
```

### Mock Mode Behavior

When `isMockMode` is `true`:

- guards allow full navigation
- services return structured mock responses
- interceptor keeps auth header behavior ready for future backend integration
- API logs are printed for debugging

When `isMockMode` is changed to `false` later:

- the frontend will use the centralized API base URL
- guards can enforce real access rules again
- services are already prepared to call the documented endpoints

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
  layout/
  shared/
```

### Core Layer

- [`ApiService`](./src/app/core/services/api.service.ts) centralizes `get`, `post`, `patch`, `delete`
- [`AuthService`](./src/app/core/services/auth.service.ts) manages mock/local session state
- [`authInterceptor`](./src/app/core/interceptors/auth.interceptor.ts) attaches `Authorization` only when a token exists and normalizes HTTP errors
- [`authGuard`](./src/app/core/guards/auth.guard.ts) and [`adminGuard`](./src/app/core/guards/admin.guard.ts) are bypassed by flag in mock mode

### Feature Layer

Each feature owns its pages and services. Mock data is centralized in services to keep components simple and ready for future backend integration.

### Shared Layer

Reusable UI primitives live under `shared/ui` and are used across ecommerce and dashboard flows.

## 6. API Contract Alignment

The single source of truth is [`documentation/routes.md`](./documentation/routes.md).

The frontend is currently prepared around:

- Base URL: `/api/v1`
- Standard success response:

```json
{ "success": true, "data": {}, "message": "OK" }
```

- Standard error response:

```json
{ "success": false, "error": "message", "code": 400 }
```

Typed models already aligned with the contract include:

- `User`
- `AuthSession`
- `Product`
- `Order`
- `Cart`
- `Production`
- `EnvironmentReading`
- dashboard metric models

## 7. Routing

Main frontend routes:

- `/login`
- `/register`
- `/products`
- `/product/:id`
- `/cart`
- `/orders`
- `/dashboard`
- `/dashboard/sales`
- `/dashboard/users`
- `/dashboard/environment`
- `/dashboard/production`

In the current phase, no route is blocked.

## 8. Manual Testing Documentation

Use [`documentation/test-routes.md`](./documentation/test-routes.md) to test the frontend manually.

That file includes:

- all frontend routes
- expected API endpoint per page
- HTTP method
- auth required by contract
- current mode (`MOCK`)
- manual validation checklist

## 9. Development Notes

- Do not move mocks back into components
- Keep services aligned with `documentation/routes.md`
- Prefer extending typed models before integrating the real backend
- Preserve `isMockMode` until the backend is ready
