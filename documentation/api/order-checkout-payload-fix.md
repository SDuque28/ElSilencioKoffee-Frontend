# Order Checkout Payload Fix

## Purpose

Document the minimum integration fix applied so the Angular checkout flow can create orders against the live Spring Boot backend.

## Root Cause

The checkout request was incompatible with the real backend in two ways:

1. The frontend sent an itemized payload shaped like:

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

2. The checkout request still ran through the frontend mock layer because `createOrderFromCart()` did not bypass `isMockMode`.

The live backend `POST /orders` endpoint currently accepts only this DTO:

```json
{
  "totalAmount": 52.24
}
```

Spring resolves the authenticated user from the JWT and derives the initial status server-side.

## Files Changed

- `ElSilencioKoffee-Frontend/src/app/features/orders/services/orders.service.ts`

## Old Payload Shape

```json
{
  "items": [
    {
      "productId": "product-id",
      "quantity": 1
    }
  ]
}
```

Behavior notes:
- This did not match `OrderCreateRequest.totalAmount`.
- In mock mode, the request did not reach the real backend.

## New Payload Shape

```json
{
  "totalAmount": 52.24
}
```

Behavior notes:
- `totalAmount` is derived from `cart.total` in the frontend service.
- The request now uses `bypassMock: true` so checkout targets the real backend even while the rest of the app remains in mock mode.

## Why This Matches The Backend

The current backend controller and DTO expect:

- `POST /orders`
- authenticated request
- request body with `totalAmount`

The backend then:

- resolves the user from `Authentication.getName()`
- validates `totalAmount > 0`
- creates the order
- sets the initial status to `NON PAID`

## Backend Changes

No backend code was changed for this fix.

This sub-task intentionally aligned the frontend to the current live backend contract, even though the previously proposed future-safe canonical contract uses explicit `items[]`.

## Validation

Validated through code-path verification:

- frontend checkout now posts to `orders`
- request body now matches `OrderCreateRequest`
- request bypasses mock mode for checkout
- existing auth interceptor still supplies the bearer token for the backend base URL
- existing success handling still maps the backend `OrderResponse` into the frontend `Order` model

## Remaining Risks / Follow-Up

- The live backend still accepts only `totalAmount`, not line items.
- The backend still trusts the client-provided total instead of recalculating it server-side.
- Product and order-detail persistence remain future work and were not changed here.
