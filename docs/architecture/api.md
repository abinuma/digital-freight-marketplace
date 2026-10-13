# API Architecture

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Style:** RESTful  
**Documentation:** OpenAPI 3.x / Swagger UI  

---

## 1. Overview

The API is the single communication interface between the React frontend and the Express.js backend. It follows REST conventions with consistent URL patterns, HTTP methods, request/response formats, and error handling.

All endpoints are prefixed with `/api/v1/` and organized by module.

---

## 2. General Conventions

| Aspect | Convention |
|--------|-----------|
| Base URL | `/api/v1` |
| Data format | JSON (`Content-Type: application/json`) |
| Authentication | Session-based via Better Auth; session token in HTTP-only cookie |
| Pagination | Query params: `?page=1&limit=20`; response includes `meta.pagination` |
| Sorting | Query param: `?sort=createdAt:desc` |
| Filtering | Query params per field: `?status=PUBLISHED&goodsType=agricultural` |
| Date format | ISO 8601 (`2026-10-03T14:30:00.000Z`) |
| IDs | UUID v4 |

---

## 3. Response Format

### Success Response

```json
{
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 87,
      "totalPages": 5
    }
  }
}
```

- **Single resource:** `"data"` is an object.
- **Collection:** `"data"` is an array, `"meta.pagination"` is included.
- **Create/Update:** Returns the created/updated resource in `"data"`.
- **Delete:** Returns `204 No Content` with no body.

### Error Response

```json
{
  "error": {
    "code": "SHIPMENT_NOT_FOUND",
    "message": "Shipment with the given ID does not exist.",
    "details": null
  }
}
```

For validation errors, `details` contains field-level issues:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed.",
    "details": [
      { "field": "weightKg", "message": "Weight must be a positive number." },
      { "field": "pickupDate", "message": "Pickup date must be in the future." }
    ]
  }
}
```

---

## 4. HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Successful GET, PUT, PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no body) |
| 400 | Validation error, malformed request |
| 401 | Not authenticated (missing or invalid session) |
| 403 | Authenticated but not authorized (wrong role) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate bid, email already registered) |
| 422 | Business rule violation (e.g., bid on non-published shipment) |
| 429 | Rate limit exceeded |
| 500 | Unexpected server error |

---

## 5. Endpoint Catalog

### 5.1 Auth Module — `/api/v1/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Register a new user (Shipper or Transporter) |
| POST | `/auth/login` | No | Authenticate and create session |
| POST | `/auth/logout` | Yes | Destroy current session |
| POST | `/auth/forgot-password` | No | Request password reset email |
| POST | `/auth/reset-password` | No | Reset password with token |
| GET | `/auth/me` | Yes | Get current authenticated user profile |
| POST | `/auth/complete-profile` | Yes | Set the signed-in user's required phone number and marketplace role |

`GET /auth/me` includes `profileComplete`. A signed-in user with `profileComplete: false` may access `/auth/me`, logout, and `POST /auth/complete-profile`; other authenticated API routes return 403 with `error.details.code: PROFILE_INCOMPLETE` until phone and role are set.

### 5.2 User / Profile — `/api/v1/users`

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/users/:id` | Yes | Any | Get user public profile |
| PATCH | `/users/:id` | Yes | Owner | Update profile (name, phone, location, photo) |
| POST | `/users/:id/profile-photo` | Yes | Owner | Upload a profile photo to Cloudinary |
| GET | `/users/:id/vehicle` | Yes | Any | Get transporter's vehicle details |
| PUT | `/users/:id/vehicle` | Yes | Transporter (owner) | Create or update vehicle details |
| GET | `/users/:id/reviews` | Yes | Any | Get reviews received by a user |

`POST /users/:id/profile-photo` accepts a single multipart file in the `photo` field. JPEG, PNG, and WebP images are supported up to 5 MB. The endpoint verifies the file signature, requires the authenticated user to match `:id`, and uses the authenticated upload rate limit.

### 5.3 Shipment Module — `/api/v1/shipments`

`GET /shipments` accepts `page` and `limit` (default `1` and `20`), `pickupLocation` and `deliveryLocation` (case-insensitive partial matches), `goodsType` (case-insensitive exact match), `pickupDateFrom` and `pickupDateTo` (inclusive `YYYY-MM-DD` bounds), and `q` (case-insensitive search across goods description and special requirements). `sortBy` accepts `createdAt` (default, newest first) or `pickupDate` (earliest first). Shippers may also filter their own shipments by `status` (`DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`). Results remain scoped by role: Transporters see only `PUBLISHED` shipments and Shippers see only their own shipments.

`GET /shipments/dashboard/summary` is restricted to Shippers and returns status counts, non-withdrawn bid and shipment-message totals, and the five most recently created owned shipments with their non-withdrawn bid counts. The message total is cumulative; it is not an unread-message count.

`GET /shipments/:id` is available to the owning Shipper, Admins, and Transporters for published shipments or shipments where they have a pending or accepted bid.

`POST /shipments/:id/images` accepts multipart form data with one or more files in the `images` field. JPEG, PNG, and WebP files are allowed up to 5 MB each, with at most 5 images stored per shipment. `DELETE /shipments/:id/images/:imageId` removes an image owned by that shipment. Uploads are limited to 20 requests per authenticated user per minute.

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/shipments` | Yes | Shipper | Create a new shipment (DRAFT) |
| GET | `/shipments` | Yes | Any | List/search shipments (Transporters see PUBLISHED; Shippers see own) |
| GET | `/shipments/dashboard/summary` | Yes | Shipper | Get own shipment, bid, and message counts plus recent shipments |
| GET | `/shipments/:id` | Yes | Shipper (owner), Admin, or Transporter (published shipment or own pending/accepted bid) | Get shipment detail |
| PATCH | `/shipments/:id` | Yes | Shipper (owner) | Update shipment fields |
| PATCH | `/shipments/:id/publish` | Yes | Shipper (owner) | Publish a DRAFT shipment |
| PATCH | `/shipments/:id/cancel` | Yes | Shipper (owner) | Cancel a shipment |
| PATCH | `/shipments/:id/complete` | Yes | Shipper (owner) | Mark shipment as completed |
| POST | `/shipments/:id/images` | Yes | Shipper (owner) | Upload image(s) to shipment |
| DELETE | `/shipments/:id/images/:imageId` | Yes | Shipper (owner) | Remove an image |

### 5.4 Bid Module — `/api/v1/shipments/:shipmentId/bids`

Bids are nested under shipments since they exist in that context.

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/shipments/:shipmentId/bids` | Yes | Transporter | Submit a bid |
| GET | `/shipments/:shipmentId/bids` | Yes | Shipper (owner) | List all bids on a shipment |
| GET | `/bids/my` | Yes | Transporter | List own bids; supports status, shipmentId, page, and limit filters |
| GET | `/shipments/:shipmentId/bids/:id` | Yes | Shipper (owner) or Transporter (owner) | Get bid detail |
| PATCH | `/shipments/:shipmentId/bids/:id` | Yes | Transporter (owner) | Update bid (price, date, message) |
| PATCH | `/shipments/:shipmentId/bids/:id/withdraw` | Yes | Transporter (owner) | Withdraw a bid |
| PATCH | `/shipments/:shipmentId/bids/:id/accept` | Yes | Shipper (shipment owner) | Accept a bid |
| PATCH | `/shipments/:shipmentId/bids/:id/decline` | Yes | Shipper (shipment owner) | Decline a bid |

### 5.5 Messaging Module — `/api/v1/messages`

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/messages/conversations` | Yes | Shipper or Transporter | List private conversations for the current user |
| GET | `/messages/conversations/:conversationId` | Yes | Conversation participants | Read messages in chronological order; prior bid conversations remain readable |
| GET | `/messages/conversations/:conversationId/bids` | Yes | Conversation participants | List bids and shipment context for this participant pair |
| GET | `/messages/conversations/:conversationId/last-message` | Yes | Conversation participants | Get the thread's latest message |
| POST | `/messages/conversations/:conversationId` | Yes | Conversation participants | Send a message with `content` |

Each conversation is unique to a shipper and transporter, regardless of the number of shipments or bids between them. Chat messages are independent of bid records. Bid navigation changes only the shipment/bid context panel; it never changes the private chat history or message composer.

### 5.6 Notification Module — `/api/v1/notifications`

`GET /notifications` accepts `page`, `limit`, and optional `unreadOnly=true` to filter unread notifications. The response pagination total reflects the selected filter, so clients can display an accurate unread count.

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/notifications` | Yes | Any | Get current user's notifications (supports `unreadOnly=true`) |
| PATCH | `/notifications/:id/read` | Yes | Owner | Mark a notification as read |
| PATCH | `/notifications/read-all` | Yes | Owner | Mark all notifications as read |

The notification list accepts `page` and `limit` (maximum 100) and returns pagination metadata. Each event notification is stored for its recipient and may also be delivered by email. Read actions are scoped to the authenticated user; marking an unknown or another user's notification returns 404. `read-all` returns the number of notifications changed.

### 5.7 Review Module — `/api/v1/shipments/:shipmentId/reviews`

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/shipments/:shipmentId/reviews` | Yes | Shipper or Transporter (participant) | Create a review after completion |
| GET | `/shipments/:shipmentId/reviews` | Yes | Any | Get reviews for a shipment |

Review creation accepts a required integer `rating` from 1 to 5 and an optional `comment`. Only the Shipper and accepted Transporter of a completed shipment may review each other, once per shipment. Shipment review lists accept the standard `page` and `limit` query parameters and return pagination metadata.

### 5.8 Admin Module — `/api/v1/admin`

All admin endpoints require `ADMIN` role.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/admin/users` | Yes | List all users (with search, filter by role/status) |
| PATCH | `/admin/users/:id/suspend` | Yes | Suspend a user account |
| PATCH | `/admin/users/:id/activate` | Yes | Reactivate a suspended user |
| GET | `/admin/shipments` | Yes (Admin) | List all shipments (filter by status; paginated) |
| PATCH | `/admin/shipments/:id/remove` | Yes | Remove/hide a shipment listing |
| GET | `/admin/metrics` | Yes | Get platform metrics (user counts, shipment stats) |

The admin user list accepts `page`, `limit`, an optional `q` (case-insensitive name/email search), `role` (`SHIPPER`, `TRANSPORTER`, or `ADMIN`), and `status` (`ACTIVE` or `SUSPENDED`). It returns user records including their suspension reason and pagination metadata. Suspending a user requires a JSON body with a non-empty `reason` of at most 500 characters; activating a user clears that reason.

The admin metrics response includes `totalUsers`, `usersByRole` (with `UNASSIGNED` for profiles without a role), `newRegistrationsLast30Days`, and `shipments` counts for `active`, `completed`, and `cancelled`. Active shipments are those in `PUBLISHED` or `IN_PROGRESS` status.

The admin shipment list accepts `page`, `limit`, and an optional `status` (`DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, or `CANCELLED`) query parameter. It includes each shipment's moderation history, with the reason, timestamp, and admin identity.

Removing a shipment requires a JSON body with a non-empty `reason` of at most 500 characters. The operation atomically hides the listing, records the admin and reason in the moderation history, and declines pending bids. Transporters with pending bids receive an email notification through the configured transactional email provider. The response includes the moderation record ID and number of declined bids.

Removing a shipment sets its `removedAt` timestamp and preserves the shipment and its related records. Removed shipments remain visible in the admin list; non-admin shipment detail, browse, bid, messaging, and review endpoints treat them as not found.

---

## 6. Request Validation

Every request body and query parameter is validated using Zod schemas before reaching the controller. Validation is applied via the shared `validate` middleware.

**Example: Create Shipment schema**

```javascript
import { z } from 'zod';

export const createShipmentSchema = z.object({
  body: z.object({
    goodsDescription: z.string().min(10).max(1000),
    goodsType: z.string().min(1).max(50),
    weightKg: z.number().positive(),
    pickupLocation: z.string().min(1).max(255),
    pickupLat: z.number().min(-90).max(90).optional(),
    pickupLng: z.number().min(-180).max(180).optional(),
    deliveryLocation: z.string().min(1).max(255),
    deliveryLat: z.number().min(-90).max(90).optional(),
    deliveryLng: z.number().min(-180).max(180).optional(),
    pickupDate: z.string().datetime(),
    specialRequirements: z.string().max(2000).optional(),
  }),
});
```

---

## 7. Pagination Convention

Paginated endpoints accept query parameters and return a `meta.pagination` block:

**Request:** `GET /api/v1/shipments?page=2&limit=10`

**Response:**

```json
{
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 87,
      "totalPages": 9
    }
  }
}
```

| Parameter | Default | Max | Description |
|-----------|---------|-----|-------------|
| `page` | 1 | — | Current page number (1-indexed) |
| `limit` | 20 | 100 | Items per page |

---

## 8. Rate Limiting

| Route Group | Limit | Window |
|-------------|-------|--------|
| Auth endpoints (`/auth/login`, `/auth/register`) | 10 requests | 15 minutes per IP |
| General API (authenticated) | 100 requests | 1 minute per user |
| File uploads | 20 requests | 1 minute per user |

Rate limit responses return `429 Too Many Requests` with a `Retry-After` header.

---

## 9. API Documentation

| Aspect | Detail |
|--------|--------|
| Specification | OpenAPI 3.x |
| Served at | `/api/docs` (Swagger UI) |
| JSON spec | `/api/docs/json` |
| Source | `server/src/modules/api-docs/openapi.js` (OpenAPI 3.1 document) |
| Served at | `/api/docs` (Swagger UI) |
| JSON spec | `/api/docs/json` |
| Environment | Available in development and production; Swagger UI assets load from unpkg CDN |

---

## 10. API Versioning Strategy

| Aspect | Decision |
|--------|----------|
| Versioning scheme | URL prefix (`/api/v1/`, `/api/v2/`) |
| Current version | `v1` |
| Backward compatibility | Non-breaking changes (new fields, new endpoints) added to the current version without a version bump |
| Breaking changes | Require a new version (`v2`); previous version remains available during a deprecation period |
| Deprecation policy | Deprecated versions receive security patches only for 6 months after a successor version is released |
| Sunset communication | `Sunset` and `Deprecation` HTTP headers added to responses from deprecated versions |

### What Constitutes a Breaking Change

| Breaking | Non-Breaking |
|----------|-------------|
| Removing a field from a response | Adding a new optional field to a response |
| Renaming an endpoint | Adding a new endpoint |
| Changing a field's type | Adding a new optional query parameter |
| Removing an endpoint | Adding a new enum value (additive) |
| Changing required → optional on request (or vice-versa) | Adding a new middleware that doesn't alter existing behavior |
