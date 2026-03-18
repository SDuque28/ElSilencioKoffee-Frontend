# API ROUTES DOCUMENTATION - EL SILENCIO KOFFEE (v1 - PRODUCTION READY)

Base URL:
`https://elsilenciokofee.com/api/v1`

Authentication:

* JWT Bearer Token requerido
* Roles: ADMIN, USER, SYSTEM (middleware)

---

# STANDARD RESPONSE FORMAT

| Type    | Structure                                               |
| ------- | ------------------------------------------------------- |
| Success | `{ "success": true, "data": {}, "message": "OK" }`      |
| Error   | `{ "success": false, "error": "message", "code": 400 }` |

---

# AUTHENTICATION

| Method | Route                   | Description       | Auth | Response Codes |
| ------ | ----------------------- | ----------------- | ---- | -------------- |
| POST   | /auth/register          | Register user     | No   | 201, 400       |
| POST   | /auth/login             | Login user        | No   | 200, 401       |
| POST   | /auth/password-recovery | Password recovery | No   | 200, 404       |
| PATCH  | /auth/change-password   | Change password   | Yes  | 200, 400       |

### Request Example (Register)

```json
{
  "name": "Juan",
  "email": "juan@mail.com",
  "password": "123456"
}
```

### Response Example (Login)

```json
{
  "token": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "role": "USER"
  }
}
```

---

# USERS

| Method | Route                  | Description | Auth  | Response Codes |
| ------ | ---------------------- | ----------- | ----- | -------------- |
| GET    | /users?page=1&limit=10 | Get users   | ADMIN | 200            |
| GET    | /users/{id}            | Get user    | ADMIN | 200, 404       |
| PATCH  | /users/{id}            | Update user | ADMIN | 200, 400       |
| DELETE | /users/{id}            | Soft delete | ADMIN | 204            |
| GET    | /users/{id}/orders     | User orders | ADMIN | 200            |

---

# PRODUCTS

| Method | Route                     | Description    | Auth  | Response Codes |
| ------ | ------------------------- | -------------- | ----- | -------------- |
| GET    | /products?page=1&limit=10 | List products  | No    | 200            |
| GET    | /products/{id}            | Get product    | No    | 200, 404       |
| POST   | /products                 | Create product | ADMIN | 201, 400       |
| PATCH  | /products/{id}            | Update product | ADMIN | 200, 400       |
| DELETE | /products/{id}            | Delete product | ADMIN | 204            |
| PATCH  | /products/{id}/stock      | Update stock   | ADMIN | 200, 400       |

### Request Example (Create Product)

```json
{
  "name": "Café Premium",
  "price": 15000,
  "stock": 50,
  "description": "Café orgánico"
}
```

---

# CART

| Method | Route                | Description     | Auth | Response Codes |
| ------ | -------------------- | --------------- | ---- | -------------- |
| GET    | /cart                | Get cart        | USER | 200            |
| POST   | /cart/items          | Add item        | USER | 201, 400       |
| PATCH  | /cart/items/{itemId} | Update quantity | USER | 200, 400       |
| DELETE | /cart/items/{itemId} | Remove item     | USER | 204            |

---

# ORDERS

| Method | Route                   | Description   | Auth  | Response Codes |
| ------ | ----------------------- | ------------- | ----- | -------------- |
| POST   | /orders                 | Create order  | USER  | 201, 400       |
| GET    | /orders?page=1&limit=10 | Get orders    | USER  | 200            |
| GET    | /orders/{id}            | Get order     | USER  | 200, 404       |
| PATCH  | /orders/{id}/status     | Update status | ADMIN | 200, 400       |

### Order Status

* PENDING
* PAID
* SHIPPED
* DELIVERED
* CANCELLED

---

# DASHBOARD

| Method | Route                                                    | Description     | Auth  | Response Codes |
| ------ | -------------------------------------------------------- | --------------- | ----- | -------------- |
| GET    | /dashboard/metrics                                       | General metrics | ADMIN | 200            |
| GET    | /dashboard/sales?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD | Sales by period | ADMIN | 200            |
| GET    | /dashboard/top-buyers                                    | Top buyers      | ADMIN | 200            |
| GET    | /dashboard/export                                        | Export CSV      | ADMIN | 200            |

---

# PRODUCTION

| Method | Route                       | Description     | Auth  | Response Codes |
| ------ | --------------------------- | --------------- | ----- | -------------- |
| GET    | /production?page=1&limit=10 | List production | ADMIN | 200            |
| POST   | /production                 | Create record   | ADMIN | 201, 400       |
| GET    | /production/{id}            | Get record      | ADMIN | 200, 404       |
| PATCH  | /production/{id}            | Update record   | ADMIN | 200            |
| DELETE | /production/{id}            | Delete record   | ADMIN | 204            |

---

# ENVIRONMENT

| Method | Route                                 | Description       | Auth   | Response Codes |
| ------ | ------------------------------------- | ----------------- | ------ | -------------- |
| POST   | /environment/readings                 | Sensor input      | SYSTEM | 201, 400       |
| GET    | /environment/readings?page=1&limit=10 | Get readings      | ADMIN  | 200            |
| GET    | /environment/readings/latest          | Latest data       | ADMIN  | 200            |
| GET    | /environment/thresholds               | Get thresholds    | ADMIN  | 200            |
| PATCH  | /environment/thresholds               | Update thresholds | ADMIN  | 200, 400       |
| GET    | /environment/alerts                   | Alerts history    | ADMIN  | 200            |

---

# ANALYSIS

| Method | Route                                                         | Description               | Auth  | Response Codes |
| ------ | ------------------------------------------------------------- | ------------------------- | ----- | -------------- |
| GET    | /analysis/comparative?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD | Production vs Environment | ADMIN | 200, 400       |

---

# DATA MODELS (SIMPLIFIED)

## User

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "password": "hashed",
  "role": "USER | ADMIN",
  "createdAt": "date"
}
```

## Product

```json
{
  "id": "uuid",
  "name": "string",
  "price": "number",
  "stock": "number",
  "description": "string"
}
```

## Order

```json
{
  "id": "uuid",
  "userId": "uuid",
  "status": "PENDING | PAID | SHIPPED | DELIVERED | CANCELLED",
  "total": "number",
  "createdAt": "date"
}
```

## Production

```json
{
  "id": "uuid",
  "date": "date",
  "quantity": "number"
}
```

## EnvironmentReading

```json
{
  "id": "uuid",
  "temperature": "number",
  "humidity": "number",
  "timestamp": "date"
}
```

---

# VALIDATIONS (KEY RULES)

| Field    | Rule                 |
| -------- | -------------------- |
| email    | Must be valid format |
| password | Min 6 characters     |
| price    | Must be > 0          |
| stock    | Must be >= 0         |
| dates    | Must be valid ISO    |

---

# SECURITY

| Feature       | Description        |
| ------------- | ------------------ |
| JWT           | Access control     |
| Refresh Token | Session renewal    |
| RBAC          | Role-based access  |
| Validation    | Input sanitization |

---

# TECHNICAL STANDARDS

| Area         | Implementation      |
| ------------ | ------------------- |
| Architecture | Domain-based        |
| API Style    | REST                |
| Versioning   | /v1                 |
| Pagination   | page & limit        |
| Naming       | English             |
| Scalability  | Microservices-ready |
