# Order Creation Payload Contract

## A. Purpose

This document defines the canonical payload contract for creating orders in El Silencio Koffee.

It resolves the current mismatch between:

- the Angular checkout flow, which currently builds a request from cart line items, and
- the Spring Boot backend, which currently accepts only a flat `totalAmount`.

The intent is to give frontend and backend implementation teams a single, implementation-ready contract for the MVP order creation flow.

## B. Current State Summary

### Current frontend behavior

- Checkout is triggered from `CartStateService#checkout`, which delegates to `OrdersService#createOrderFromCart`.
- The frontend cart is a multi-item structure with:
  - line items
  - per-item quantity
  - per-item unit price
  - per-item subtotal
  - cart subtotal
  - cart shipping
  - cart total
- The checkout request body currently sends only:
  - `items[].productId`
  - `items[].quantity`
- The current frontend does **not** send:
  - `userId`
  - `totalAmount`
  - `subtotal`
  - `shipping`
  - payment metadata
  - notes
- Because `isMockMode` is still `true`, the checkout call is currently mock-backed, but the request body shape already represents the future real integration path.

### Current backend behavior

- `POST /orders` is implemented in `OrderController#createOrder`.
- The backend currently accepts only:
  - `OrderCreateRequest.totalAmount`
- The backend:
  - resolves the authenticated user from `Authentication.getName()`
  - creates a single `orders` row
  - sets `status = NON PAID`
  - persists `totalAmount`
  - does **not** accept or persist line items
  - does **not** use the existing `orders_details` table defined in `database.sql`

### Core mismatch

- Frontend sends `items[]` but no `totalAmount`
- Backend requires `totalAmount` but no `items[]`
- The SQL schema already includes `orders_details`, which strongly suggests the intended domain model is line-item-based
- Current frontend `productId` is a `string`, while the SQL schema expects numeric product identifiers

## C. Current Frontend Payload

### Files inspected

- `ElSilencioKoffee-Frontend/src/app/features/orders/services/orders.service.ts`
- `ElSilencioKoffee-Frontend/src/app/features/cart/services/cart-state.service.ts`
- `ElSilencioKoffee-Frontend/src/app/core/models/cart.model.ts`
- `ElSilencioKoffee-Frontend/src/app/core/models/product.model.ts`
- `ElSilencioKoffee-Frontend/src/app/core/models/order.model.ts`
- `ElSilencioKoffee-Frontend/src/app/core/interceptors/auth.interceptor.ts`
- `ElSilencioKoffee-Frontend/src/app/core/services/auth.service.ts`

### Current cart model

```ts
interface CartItem {
  itemId: string;
  productId: string;
  name: string;
  category: string;
  image: string;
  selectionLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
}
```

### Current checkout assembly

Current request body is built in:

- `OrdersService#createOrderFromCart(cart)`

Current request body shape:

```json
{
  "items": [
    {
      "productId": "ethiopian-yirgacheffe",
      "quantity": 2
    }
  ]
}
```

### Example current frontend payload

This example reflects the current Angular code path and current frontend types.

```json
{
  "items": [
    {
      "productId": "ethiopian-yirgacheffe",
      "quantity": 2
    },
    {
      "productId": "espresso-capsules",
      "quantity": 1
    }
  ]
}
```

### Frontend fields currently available but not sent

The cart already has these values locally, but they are not sent to the backend:

- `cart.subtotal`
- `cart.shipping`
- `cart.total`
- `item.unitPrice`
- `item.subtotal`
- display-only product data:
  - `name`
  - `category`
  - `image`
  - `selectionLabel`

### Auth and headers in current frontend

- `Authorization: Bearer <jwt>` is added automatically by `auth.interceptor.ts` for known API requests when a token is present.
- `Content-Type: application/json` is also added automatically for `POST` and `PATCH` requests when missing.
- `userId` is not sent in the checkout payload.
- `currentUserId` is only used to fabricate the mock order response on the frontend side.

## D. Current Backend Contract

### Files inspected

- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/controllers/OrderController.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/services/impl/OrderServiceImpl.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/dto/OrderCreateRequest.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/dto/OrderResponse.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/entities/Order.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/entities/OrderStatus.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/security/SecurityConfig.java`
- `ElSilencioKoffee-Backend/src/main/java/ElSilencioKoffee_Backend/controllers/GlobalExceptionHandler.java`
- `ElSilencioKoffee-Backend/src/main/resources/database.sql`

### Current endpoint

- Path: `/orders`
- Method: `POST`
- Security: `@PreAuthorize("hasAnyRole('USER','ADMIN')")`
- Authenticated user source: `Authentication.getName()`

### Current request DTO

```java
public class OrderCreateRequest {
    private BigDecimal totalAmount;
}
```

### Current service behavior

`OrderServiceImpl#createOrder(String username, BigDecimal totalAmount)`:

- validates `totalAmount != null`
- validates `totalAmount > 0`
- resolves `Usuario` by username from JWT subject
- creates a new `Order`
- sets:
  - `usuario`
  - `totalAmount`
  - `status = NON_PAID`
- saves the order

### Current entity model

Current persisted order fields:

- `id`
- `usuario`
- `orderDate`
- `totalAmount`
- `status`

There is **no current JPA entity relationship** to order detail rows.

### Current database context

`database.sql` contains:

- `orders`
- `orders_details`

The `orders_details` table includes:

- `id_order`
- `id_product`
- `quantity`
- `unit_price`

This means the schema already anticipates explicit order line items even though the current backend implementation does not use them yet.

### Current backend success response

Current controller response body:

```json
{
  "id": 123,
  "userId": 5,
  "orderDate": "2026-04-20T10:30:00",
  "totalAmount": 54000.00,
  "status": "NON PAID"
}
```

### Current backend error behavior

Observed error patterns from `GlobalExceptionHandler`:

- `400 Bad Request`

```json
{
  "message": "Total amount is required"
}
```

- `404 Not Found`

```json
{
  "message": "User not found: username"
}
```

- `401 Unauthorized`
  - empty body
- `403 Forbidden`
  - empty body

### Current backend limitations

- no item array in request
- no order detail persistence
- no price re-validation
- no product existence validation
- no stock validation
- no bean validation annotations
- no recalculation of totals from trusted server-side data

## E. Canonical Contract Definition

## Canonical design decision

For the current MVP, the canonical create-order contract should be **line-item-based**, not `totalAmount`-only.

This is the safest practical design because:

1. the frontend checkout already works from cart items,
2. the cart is explicitly multi-product,
3. the schema already includes `orders_details`,
4. trusting a frontend-supplied total is weaker than validating products and calculating totals server-side.

### Canonical endpoint

- Path: `/orders`
- Method: `POST`
- Authentication: required
- Authorized roles: `USER` and `ADMIN` for creation

### Required request headers

- `Authorization: Bearer <jwt>`
- `Content-Type: application/json`

### Canonical request body

```json
{
  "items": [
    {
      "productId": 101,
      "quantity": 2
    },
    {
      "productId": 205,
      "quantity": 1
    }
  ]
}
```

### Canonical request DTO proposal

```json
{
  "items": [
    {
      "productId": 101,
      "quantity": 2
    }
  ]
}
```

#### Required fields

- `items`
  - type: array
  - required
  - minimum length: `1`
- `items[].productId`
  - type: integer / long
  - required
- `items[].quantity`
  - type: integer
  - required
  - must be greater than `0`

#### Optional fields

- None in the MVP canonical contract.

This avoids inventing unsupported fields such as:

- notes
- payment method
- shipping amount
- client total

Those can be added later in explicit versioned DTO changes if needed.

### Canonical response body

The response should include the created order plus the persisted line items used to compute the final total.

```json
{
  "id": 123,
  "userId": 5,
  "orderDate": "2026-04-20T10:30:00",
  "status": "NON PAID",
  "totalAmount": 81000.00,
  "items": [
    {
      "productId": 101,
      "quantity": 2,
      "unitPrice": 27000.00,
      "subtotal": 54000.00
    },
    {
      "productId": 205,
      "quantity": 1,
      "unitPrice": 27000.00,
      "subtotal": 27000.00
    }
  ]
}
```

### Example proposed canonical request

```json
{
  "items": [
    {
      "productId": 101,
      "quantity": 2
    },
    {
      "productId": 205,
      "quantity": 1
    }
  ]
}
```

### Example proposed success response

```json
{
  "id": 123,
  "userId": 5,
  "orderDate": "2026-04-20T10:30:00",
  "status": "NON PAID",
  "totalAmount": 81000.00,
  "items": [
    {
      "productId": 101,
      "quantity": 2,
      "unitPrice": 27000.00,
      "subtotal": 54000.00
    },
    {
      "productId": 205,
      "quantity": 1,
      "unitPrice": 27000.00,
      "subtotal": 27000.00
    }
  ]
}
```

### Canonical error responses

- `400 Bad Request`

```json
{
  "message": "Order must contain at least one item"
}
```

- `400 Bad Request`

```json
{
  "message": "Item quantity must be greater than 0"
}
```

- `404 Not Found`

```json
{
  "message": "Product not found: 101"
}
```

- `401 Unauthorized`
  - empty body or standardized message body if the backend later adopts a global error format

- `403 Forbidden`
  - empty body or standardized message body if the backend later adopts a global error format

## Responsibility split

### Frontend responsibility

- send only the item list
- ensure the cart is not empty before calling checkout
- ensure quantity is a positive integer in the UI
- include JWT automatically through the interceptor
- display the created order returned by the backend

### Backend responsibility

- resolve the authenticated user from JWT subject
- validate every referenced product
- validate every quantity
- re-read prices from trusted server-side data
- calculate `unitPrice`, `subtotal`, and `totalAmount`
- assign initial order status
- generate `id` and `orderDate`
- persist both order header and order details

### Database persistence responsibility

- `orders`
  - `id_order`
  - `id_user`
  - `order_date`
  - `total_amount`
  - `status`
- `orders_details`
  - `id_order`
  - `id_product`
  - `quantity`
  - `unit_price`

### Derived/calculated fields

- `userId`
  - derived from JWT-backed authenticated user
- `orderDate`
  - generated server-side
- `status`
  - generated server-side
- `unitPrice`
  - read server-side from product data
- `subtotal`
  - computed server-side
- `totalAmount`
  - computed server-side as sum of line subtotals

### Fields the frontend must not send

- `userId`
- `status`
- `orderDate`
- `totalAmount`
- `unitPrice`
- `subtotal`

## F. Field Mapping Table

| Contract Section | Frontend Field | Frontend Type | Backend DTO Field | Backend Type | Entity Field | Required | Validation Rules | Ownership | Notes / Change Needed |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Request | `items` | `CartItem[] -> mapped array` | `items` | `List<OrderItemCreateRequest>` | `orders_details` rows | Yes | min length `1` | Shared | Backend must add nested items DTO support. |
| Request item | `items[].productId` | `string` currently | `items[].productId` | `Long` | `orders_details.id_product` | Yes | product must exist | Frontend sends, backend validates | Frontend must migrate real checkout product IDs from string mock slugs to numeric IDs. |
| Request item | `items[].quantity` | `number` | `items[].quantity` | `Integer` | `orders_details.quantity` | Yes | integer `> 0` | Shared | Current frontend already enforces positive quantity in cart interactions. |
| Frontend-only local cart | `items[].name` | `string` | None | None | None | No | N/A | Frontend | Display-only; must not be trusted from request body. |
| Frontend-only local cart | `items[].category` | `string` | None | None | None | No | N/A | Frontend | Display-only. |
| Frontend-only local cart | `items[].image` | `string` | None | None | None | No | N/A | Frontend | Display-only. |
| Frontend-only local cart | `items[].selectionLabel` | `string` | None | None | None | No | N/A | Frontend | Display-only. |
| Frontend-only local cart | `items[].unitPrice` | `number` | None in request | None | `orders_details.unit_price` on persistence | No | N/A | Backend source of truth | Frontend local price exists for UI only; backend should re-read trusted product price. |
| Frontend-only local cart | `items[].subtotal` | `number` | None in request | None | derived from `quantity * unit_price` | No | N/A | Backend source of truth | Do not trust client subtotal. |
| Frontend-only local cart | `subtotal` | `number` | None in request | None | derived only | No | N/A | Frontend display / backend recomputes internally | Not persisted in current schema. |
| Frontend-only local cart | `shipping` | `number` | None in request | None | none in current schema | No | N/A | Frontend display | Current frontend shipping is fixed to `0`; backend schema has no shipping column. |
| Current frontend local cart | `total` | `number` | None in canonical request | None | `orders.total_amount` derived server-side | No | N/A | Backend source of truth | Current backend DTO requires it, but canonical contract removes it from request. |
| Auth context | none in request | N/A | none in request | N/A | `orders.id_user` via `Order.usuario` | Yes at runtime | authenticated user required | Backend | Must come from JWT subject, not request body. |
| Response | none currently consumed beyond `id` | N/A | `id` | `Long` | `orders.id_order` | Yes | generated | Backend | Existing frontend can already consume `id`. |
| Response | none currently sent by FE | N/A | `userId` | `Long` | `orders.id_user` | Yes | generated from auth user | Backend | Useful for order history and admin views. |
| Response | none currently sent by FE | N/A | `orderDate` | `LocalDateTime` | `orders.order_date` | Yes | generated | Backend | Already generated with `@PrePersist` today. |
| Response | none currently sent by FE | N/A | `status` | `OrderStatus` | `orders.status` | Yes | initialized server-side | Backend | For MVP create as `NON PAID`. |
| Response | none currently sent by FE | N/A | `totalAmount` | `BigDecimal` | `orders.total_amount` | Yes | sum of item subtotals | Backend | Current frontend already expects this field in order responses. |
| Response item | none currently modeled in `Order` | N/A | `items[].productId` | `Long` | `orders_details.id_product` | Yes | generated from persisted detail row | Backend | Add to response DTO. |
| Response item | none currently modeled in `Order` | N/A | `items[].quantity` | `Integer` | `orders_details.quantity` | Yes | positive integer | Backend | Add to response DTO. |
| Response item | none currently modeled in `Order` | N/A | `items[].unitPrice` | `BigDecimal` | `orders_details.unit_price` | Yes | product price snapshot | Backend | Add to response DTO. |
| Response item | none currently modeled in `Order` | N/A | `items[].subtotal` | `BigDecimal` | derived from detail row | Yes | `quantity * unitPrice` | Backend | Add to response DTO. |

## G. Validation and Business Rules

### Canonical validation rules

1. Order must contain at least one item.
2. Every item must include a valid `productId`.
3. Every item quantity must be an integer greater than `0`.
4. Duplicate product IDs in the request should either:
   - be rejected, or
   - be normalized server-side into a single merged line.

Recommended MVP choice:
- normalize duplicates server-side before persistence.

5. Authenticated user must be resolved from JWT and must not come from the request body.
6. Backend must re-read authoritative product price data instead of trusting frontend item prices.
7. Backend must calculate:
   - `unitPrice`
   - `subtotal`
   - `totalAmount`
8. Order status must be initialized server-side as `NON PAID`.
9. `orderDate` must be generated server-side.
10. If any referenced product does not exist, the entire request must fail atomically.

### Business rules for MVP

- Payment details are out of scope for this contract.
- Shipping is out of scope for persistence because there is no shipping field in the current order schema.
- Notes are out of scope for the current MVP because there is no existing frontend or backend field for them.
- The backend should treat product price as a snapshot at order creation time and store it in `orders_details.unit_price`.

## H. Mismatch Analysis

### 1. Payload shape mismatch

- Current frontend request:

```json
{
  "items": [
    {
      "productId": "ethiopian-yirgacheffe",
      "quantity": 2
    }
  ]
}
```

- Current backend request:

```json
{
  "totalAmount": 54000.00
}
```

Impact:
- direct integration will fail immediately

### 2. Product ID type mismatch

- Current frontend product and cart types use `string` identifiers
- Current database schema implies numeric product IDs

Impact:
- even after line items are accepted server-side, current frontend product IDs are not compatible with the backend schema

### 3. Total trust mismatch

- Frontend already knows `cart.total`
- Backend currently requires `totalAmount` from the client
- Safe contract design should make the backend the source of truth for totals

Impact:
- current backend design is weaker against client tampering

### 4. Order detail modeling gap

- Frontend checkout is multi-item
- Database has `orders_details`
- Backend implementation has only order header persistence

Impact:
- the current backend cannot represent what the frontend cart actually contains

### 5. Response contract gap

- Current backend order response returns only order header data
- Canonical contract for multi-item checkout should return created line items as well

Impact:
- frontend cannot reliably confirm what the backend actually accepted without an itemized response

### 6. Missing validation gap

- No bean validation annotations currently protect the create-order DTO
- Current service logic only validates `totalAmount > 0`

Impact:
- current implementation is under-validated for a cart-based order creation flow

## I. Recommended Implementation Changes

### Frontend changes needed

1. Change checkout request construction to target the canonical line-item contract:
   - keep sending `items[]`
   - stop planning around `totalAmount` in the request

2. Update frontend product/cart identity types for real backend integration:
   - migrate `productId` from mock string slug to numeric ID for server-backed products

3. Keep frontend totals for UI only:
   - `subtotal`
   - `shipping`
   - `total`
   - but do not treat them as backend source of truth

4. Update frontend order response types to optionally support itemized response data:
   - add `items[]` to the order creation response model once backend is implemented

### Backend changes needed

1. Replace the current `OrderCreateRequest` contract:
   - from `totalAmount`
   - to `items[]`

2. Add nested DTOs for order creation and itemized response.
   - Example:
     - `OrderItemCreateRequest`
     - `OrderItemResponse`
     - extended `OrderResponse` or dedicated `OrderCreateResponse`

3. Implement persistence for order details using `orders_details`.

4. Recalculate totals server-side from trusted product prices.

5. Add validation rules for:
   - non-empty items list
   - valid product IDs
   - positive quantities

6. Keep `userId`, `status`, `orderDate`, and `totalAmount` server-derived.

### Optional future improvements

1. Add inventory checks and stock reservation during order creation.
2. Add payment status expansion beyond `NON PAID` and `PAID`.
3. Add order notes or delivery instructions when the business needs them.
4. Standardize backend success and error envelopes across all APIs if the project later wants a consistent HTTP response wrapper.

## Final Canonical Recommendation

For this project's current MVP, the canonical create-order contract should be:

- request body: `items[]`
- authenticated user: derived from JWT
- totals: calculated by backend
- status: set by backend
- order details: persisted explicitly
- response: created order header plus itemized order details

This is the smallest contract that is both:

- compatible with the real frontend cart flow, and
- consistent with the existing SQL schema.
