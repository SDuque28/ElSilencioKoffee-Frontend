# Frontend Test Routes

## Scope

- Phase: `PRE-BACKEND STABILIZATION`
- Current mode: `MOCK`
- Global mock flag: `isMockMode = true`
- Navigation guards: bypassed by flag
- API base prepared for future integration: `/api/v1`

## How To Access The Frontend

1. Run `npm start`
2. Open the local Angular URL shown in the terminal
3. Navigate directly with the paths listed below

## Frontend Routes Matrix

| Frontend Route | How To Access | What The Page Does | Expected API Endpoint | HTTP Method | Auth Required By Contract | Current Mode | Manual Test |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Open root URL | Redirects to product catalog | N/A | N/A | No | MOCK | Confirm redirect to `/products` |
| `/login` | Open `/login` | Mock login form and local session creation | `/auth/login` | `POST` | No | MOCK | Submit any valid email/password and confirm redirect |
| `/register` | Open `/register` | Mock register form and local session creation | `/auth/register` | `POST` | No | MOCK | Submit valid name/email/password and confirm redirect |
| `/products` | Open `/products` | Lists catalog items using structured product mocks | `/products?page=1&limit=10` | `GET` | No | MOCK | Confirm cards render, details button opens product page |
| `/product/:id` | Example: `/product/prod-premium-01` | Displays a single product with stock and price | `/products/{id}` | `GET` | No | MOCK | Open a valid product id and verify content loads |
| `/cart` | Open `/cart` | Loads cart, updates quantities, simulates checkout | `/cart`, `/cart/items`, `/cart/items/{itemId}`, `/orders` | `GET`, `POST`, `PATCH`, `DELETE` | USER | MOCK | Increase/decrease quantity, clear cart, simulate purchase |
| `/orders` | Open `/orders` | Shows mock order history aligned with contract statuses | `/orders?page=1&limit=10` | `GET` | USER | MOCK | Confirm list renders and statuses are valid (`PENDING`, `SHIPPED`, `DELIVERED`) |
| `/dashboard` | Open `/dashboard` | Shows overview KPIs and sales trend | `/dashboard/metrics`, `/dashboard/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `GET`, `GET` | ADMIN | MOCK | Confirm KPIs and chart load without login |
| `/dashboard/sales` | Open `/dashboard/sales` | Shows sales chart for mock period data | `/dashboard/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` | `GET` | ADMIN | MOCK | Confirm chart loads and no route blocking occurs |
| `/dashboard/users` | Open `/dashboard/users` | Shows mock top buyers table | `/dashboard/top-buyers` | `GET` | ADMIN | MOCK | Confirm rows render with purchases and spend |
| `/dashboard/environment` | Open `/dashboard/environment` | Shows temperature and humidity charts | `/environment/readings?page=1&limit=10`, `/environment/readings/latest` | `GET`, `GET` | ADMIN | MOCK | Confirm both charts render with reading data |
| `/dashboard/production` | Open `/dashboard/production` | Shows production output chart | `/production?page=1&limit=10` | `GET` | ADMIN | MOCK | Confirm chart loads with quantity data |
| `**` | Open any invalid path | Redirects to product catalog | N/A | N/A | No | MOCK | Confirm invalid route returns to `/products` |

## Manual Validation Checklist

### Navigation

- Open every route in the matrix directly from the browser
- Confirm no route is blocked by auth or admin guards
- Confirm invalid routes redirect safely to `/products`

### Auth

- Login with a regular email and confirm a `USER` mock session
- Login with an email containing `admin` and confirm admin navigation remains available
- Register a new mock account and confirm redirect to `/products`
- Use logout and confirm the app returns to `/login`

### Products

- Validate the catalog renders three structured mock products
- Open `/product/prod-premium-01`
- Open `/product/prod-forest-03`
- Confirm stock labels and prices are visible

### Cart And Orders

- Open `/cart`
- Increase and decrease quantities
- Reduce one item to zero and confirm it is removed
- Click `Simulate purchase`
- Confirm success toast appears
- Open `/orders`
- Confirm the newly created mock order appears at the top
- Confirm the cart is empty after checkout

### Dashboard

- Open `/dashboard`
- Confirm KPI cards load
- Confirm overview chart loads
- Open `/dashboard/sales`
- Confirm bar chart loads
- Open `/dashboard/users`
- Confirm top buyers table loads
- Open `/dashboard/environment`
- Confirm temperature and humidity charts load
- Open `/dashboard/production`
- Confirm production chart loads

## Notes For Future Real Backend Integration

- Keep `isMockMode = false` when the real backend is ready
- Guards are already prepared to be re-enabled by flag
- Services already point to contract-aligned endpoints
- Mock data lives in services, not components, to reduce migration cost
