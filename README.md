# El Silencio Koffee Frontend

Angular frontend foundation for an ecommerce platform with analytics and environmental monitoring, designed to consume a Spring Boot REST API.

## 1. Tech Stack

- Angular 21 (Standalone Components + Angular Router + HttpClient)
- TypeScript strict mode
- TailwindCSS
- class-variance-authority + clsx + tailwind-merge (design-system style variants)
- lucide-angular (icon system)
- Chart.js (dashboard chart rendering)
- ESLint + Prettier

## 2. Setup

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm start
```

Default URL: `http://localhost:4200`

### Build for production

```bash
npm run build
```

### Lint and format

```bash
npm run lint
npm run format
```

## 3. Environment Configuration

Environment files live in `src/environments`:

- `environment.ts`
- `environment.development.ts`
- `environment.production.ts`

Each exposes:

```ts
apiUrl: 'http://localhost:8080/api';
```

Production replaces this with:

```ts
apiUrl: 'https://api.elsilenciokoffee.com/api';
```

`angular.json` is configured with file replacements for development and production builds.

## 4. Architecture Summary

This project follows a feature-based, scalable structure:

```text
src/app
  core/
    services/
    interceptors/
    guards/
    models/
  shared/
    components/
    ui/
    directives/
    pipes/
  layout/
    components/
    header/
    footer/
    sidebar/
    main-layout/
  features/
    auth/
    products/
    cart/
    orders/
    dashboard/
    environment-monitoring/
    production/
```

### Core layer

Contains singleton infrastructure:

- `ApiService` (`core/services/api.service.ts`) wraps `HttpClient` with `get/post/put/delete`.
- `AuthService` (`core/services/auth.service.ts`) manages token/user session state.
- `authInterceptor` (`core/interceptors/auth.interceptor.ts`) injects JWT token into API requests.
- `authGuard` and `adminGuard` protect authenticated and admin routes.

### Shared layer

Reusable, cross-feature UI and primitives:

- `shared/ui/button`
- `shared/ui/card`
- `shared/ui/input`
- `shared/ui/form-field`
- `shared/ui/dialog`
- `shared/ui/toast`
- `shared/ui/badge`
- `shared/ui/dropdown`
- `shared/ui/tabs`
- `shared/ui/table`
- `shared/ui/chart`

### Layout layer

Separates layout concerns from feature content:

- `Header` + `Footer` for global shell
- `Sidebar` for admin navigation
- `MainLayout` supports both public ecommerce and admin dashboard modes

### Features layer

Each feature owns its routes/pages/services and can evolve independently.

## 5. Routing and Lazy Loading

Configured in `src/app/app.routes.ts` with lazy loading for features:

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

Admin dashboard routes are protected with `authGuard` + `adminGuard`.

## 6. State Management Strategy

Current state strategy is intentionally simple:

- Angular Signals for local and feature state (for example `CartStateService`)
- RxJS streams for async HTTP interactions

This avoids premature complexity and leaves room for NgRx adoption only if scale demands it.

## 7. Design System Foundation

A shadcn-inspired Angular UI approach is implemented using:

- `class-variance-authority` for variant APIs (button/badge)
- `clsx` + `tailwind-merge` via `cn()` helper for predictable class composition
- Tailwind utility tokens centralized in `tailwind.config.js`

## 8. Chart Support

`shared/ui/chart/chart-container.component.ts` wraps Chart.js so future dashboard charts can be added with a unified API.

## 9. REST Integration Pattern

All HTTP calls should pass through `ApiService` to keep:

- Base URL handling centralized
- Request conventions consistent
- Future enhancements (retry, error mapping, telemetry) in one place
