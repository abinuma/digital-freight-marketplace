# Implementation Plan

**Project:** Digital Freight Marketplace  
**Created:** 2026-10-04  
**Status:** Draft — Awaiting User Review  
**Source of Truth:** [product-overview.md](./product-overview.md), [requirements/](./requirements/), [architecture/](./architecture/)

---

## Overview

This plan takes the project from its current state (documentation complete, no source code) through implementation, testing, deployment, and production verification. It is organized into **8 phases**, each building on the previous one.

### Phase Dependency Chain

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7 → Phase 8
Setup      Database   Auth      Shipment   Bid       Msg/Notif  Frontend   Deploy
                                & Search             Review     (React)    & QA
                                                     Admin
```

### Priority Scope

The plan implements all **Must** and **Should** requirements from the [functional requirements](./requirements/functional-requirements.md), including Google OAuth (FR-008). **Could** requirements (FR-402 unread badges, FR-605 reports queue, FR-701/FR-702 in-app notifications) are deferred to a follow-up iteration and are not included in this plan unless noted.

---

## Phase 1: Project Setup & Foundation

### Objective

Establish the monorepo structure, development tooling, shared infrastructure code, and local development environment so that all subsequent phases can be built on a consistent, working foundation.

### Tasks

1. **Initialize repository structure**
   - Create root-level `server/` and `client/` directories per [architecture.md § 4](./architecture/architecture.md).
   - Initialize `server/package.json` with `"type": "module"` (ES modules).
   - Initialize `client/package.json` via Vite + React scaffold.

2. **Install server dependencies**
   - `express`, `zod`, `prisma`, `@prisma/client`, `better-auth`, `pino` (logger), `helmet`, `cors`, `express-rate-limit`, `multer` (file upload middleware), and the selected Cloudinary SDK.
   - Dev dependencies: `vitest`, `supertest`, `eslint`, `prettier`, `nodemon`.

3. **Install client dependencies (run these commands from `client/`)**
   - Runtime packages: `npm install react-router-dom @tanstack/react-query tailwindcss @tailwindcss/vite leaflet react-leaflet axios zod`.
   - Development packages: `npm install -D vitest @playwright/test prettier`.
   - The React/Vite scaffold dependencies are already declared; add the other packages only when ready to use them.

4. **Configure development tooling**
   - ESLint + Prettier configuration for both `server/` and `client/`.
   - `.env.example` in repository root documenting every variable from [deployment.md § 2](./architecture/deployment.md).
   - `.gitignore` covering `node_modules`, `.env`, `dist/`, `.prisma/`.

5. **Implement shared server infrastructure**  
   Files under `server/src/shared/` as specified in [architecture.md § 4](./architecture/architecture.md):
   - `shared/config/index.js` — Environment variable loading and validation.
   - `shared/db/prisma.js` — Singleton Prisma client instance per [deployment.md § 6](./architecture/deployment.md).
   - `shared/utils/AppError.js` — Custom error class per [architecture.md § 6.2](./architecture/architecture.md).
   - `shared/utils/logger.js` — Structured JSON logger (pino) per [architecture.md § 6.3](./architecture/architecture.md).
   - `shared/utils/pagination.js` — Pagination helper (parse `page`/`limit` query params, compute `skip`/`take`, format `meta.pagination` per [api.md § 7](./architecture/api.md)).
   - `shared/middleware/errorHandler.js` — Global error handler per [architecture.md § 6.2](./architecture/architecture.md).
   - `shared/middleware/validate.js` — Zod validation middleware per [architecture.md § 6.1](./architecture/architecture.md).
   - `shared/middleware/rateLimiter.js` — Rate limiter configurations per [api.md § 8](./architecture/api.md) and [security.md § 8](./architecture/security.md).

6. **Create Express application skeleton**
   - `server/src/app.js` — Express app with global middleware (CORS, Helmet, body parser, rate limiter, error handler).
   - `server/src/server.js` — Server entry point (port binding, startup log).
   - `server/src/index.js` — Module registration stub (will mount module routers as they are built).
   - Health check endpoint: `GET /api/v1/health` per [deployment.md § 5](./architecture/deployment.md).

7. **Configure Neon for database access**
   - Use the Neon PostgreSQL project as the only database environment, including during local development.
   - Store the Neon `DATABASE_URL` in `server/.env` (ignored by Git); document only a placeholder in the root `.env.example`.
   - Keep credentials out of source control and use Neon-provided TLS connection settings.

8. **CI pipeline skeleton**
   - `.github/workflows/ci.yml` per [deployment.md § 8](./architecture/deployment.md) — lint, test, build, audit stages.
   - Initial run may skip test steps until tests exist.

### Deliverables

- Working `server/` directory with Express app that starts and responds to `GET /api/v1/health`.
- Working `client/` directory with Vite dev server serving a placeholder page.
- API and client run locally; the API connects to the configured Neon PostgreSQL database.
- All shared middleware and utilities implemented and unit-tested.
- CI pipeline runs lint + build successfully.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | `npm run dev` in `server/` starts Express on port 5000 | Manual run |
| 2 | `GET http://localhost:5000/api/v1/health` returns `{ "status": "healthy", ... }` | HTTP request |
| 3 | `npm run dev` in `client/` starts Vite on port 3000 | Manual run |
| 4 | API connects to Neon using `DATABASE_URL` | Manual verification after Neon credentials are configured |
| 5 | ESLint passes with zero errors in both `server/` and `client/` | `npm run lint` |
| 6 | `errorHandler` middleware formats errors per the documented JSON structure | Unit test |
| 7 | `validate` middleware rejects invalid input with 400 and Zod error details | Unit test |
| 8 | `pagination` helper produces correct `meta.pagination` output | Unit test |
| 9 | Rate limiter correctly limits requests per configured window | Unit test |

### User Actions Required

> No additional user decisions are needed to complete Phase 1. Neon is the selected database, Cloudinary is the selected file-storage provider, and Brevo is the selected transactional email provider. Configure service credentials only when the phase that uses them begins.

---

## Phase 2: Database Schema & ORM Layer

### Objective

Define the complete Prisma schema matching [database.md](./architecture/database.md), generate the initial migration, seed development data, and verify all entities, indexes, and constraints are correctly in place.

> **Temporary Prisma setup check:** Phase 1 currently has a minimal `TestRecord` model to verify Prisma configuration. Validate it with `npx prisma validate` from `server/`. Replace it with the complete marketplace schema below before creating or applying any database migration.

### Tasks

0. **Install the Neon Prisma adapter**
   - From `server/`, run `npm install @prisma/adapter-neon@^7.10.0` when beginning Phase 2.
   - Keep the adapter version aligned with the installed Prisma 7 packages.

1. **Write `prisma/schema.prisma`**
   Define all models from [database.md § 3](./architecture/database.md):
   - `User` (§ 3.1) with enums `Role` (`SHIPPER`, `TRANSPORTER`, `ADMIN`) and `UserStatus` (`ACTIVE`, `SUSPENDED`).
   - `Vehicle` (§ 3.2) with unique constraint on `userId`.
   - `Shipment` (§ 3.3) with enum `ShipmentStatus` (`DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
   - `ShipmentImage` (§ 3.4) with `ON DELETE CASCADE` from `Shipment`.
   - `Bid` (§ 3.5) with enum `BidStatus` (`PENDING`, `ACCEPTED`, `DECLINED`, `WITHDRAWN`), partial unique index `(shipmentId, transporterId)` for active bids.
   - `Message` (§ 3.6) and `Conversation` (§ 3.7), with one private conversation per shipper/transporter pair and messages independent of bids and shipments.
   - `Review` (§ 3.8) with unique constraint `(shipmentId, reviewerId)` and CHECK `rating >= 1 AND rating <= 5`.
   - `Notification` (§ 3.9).
   - Better Auth session/account tables as required by the library.

2. **Define indexes**
   All indexes from [database.md § 4](./architecture/database.md):
   - `idx_user_email`, `idx_user_role_status`, `idx_shipment_shipper`, `idx_shipment_status`, `idx_shipment_goods_type`, `idx_shipment_pickup_date`, `idx_shipment_created`, `idx_bid_shipment`, `idx_bid_transporter`, `idx_bid_shipment_transporter`, `idx_message_conversation_created`, `idx_conversation_shipper_transporter`, `idx_conversation_transporter_updated`, `idx_conversation_shipper_updated`, `idx_notification_user`, `idx_review_reviewee`.

3. **Configure data integrity rules**
   Per [database.md § 7](./architecture/database.md):
   - ON DELETE CASCADE for ShipmentImage.
   - ON DELETE RESTRICT for Bid → Shipment and Conversation → User.

4. **Generate and apply initial migration**
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Write seed script**
   - `prisma/seed.js` — Create one Admin user, two sample Shippers, two sample Transporters (with vehicles), and a few sample shipments in various statuses.

6. **Verify schema**
   - Run the migration against a dedicated Neon development branch/database (never production).
   - Seed data and verify via Prisma Studio or direct queries.

### Deliverables

- Complete `prisma/schema.prisma`.
- Initial migration in `prisma/migrations/`.
- Seed script `prisma/seed.js`.
- All entities and indexes created in the Neon development database.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | `npx prisma migrate dev` applies cleanly on a fresh Neon development branch | Command exits 0 |
| 2 | `npx prisma db seed` populates sample data without errors | Command exits 0 |
| 3 | All 8 marketplace tables and 3 Better Auth tables exist with correct columns and types | `npx prisma studio` inspection |
| 4 | Unique constraints enforced (Vehicle.userId, active bid per transporter per shipment, review per user per shipment) | Attempted duplicate inserts fail |
| 5 | ON DELETE CASCADE works for ShipmentImage when parent Shipment is deleted | Integration test |
| 6 | ON DELETE RESTRICT prevents Shipment deletion when bids exist | Integration test |
| 7 | Rating CHECK constraint rejects values < 1 or > 5 | Integration test |
| 8 | All listed indexes exist in the database | `\di` in psql or Prisma Studio |

### User Actions Required

> Ensure the Neon development branch is available and its connection string is configured in `server/.env` before applying migrations. Use a separate Neon branch for production.

---

## Phase 3: Authentication Module

### Objective

Implement the `auth` module — user registration, login, logout, password reset, profile management, and vehicle management — with RBAC middleware. This is the foundation that all other modules depend on for user identity and access control.

### Tasks

1. **Configure Better Auth**
   - Set up Better Auth with PostgreSQL session storage per [security.md § 2](./architecture/security.md).
   - Enable email/password signup and login, plus Google OAuth (FR-008). Require phone and role during manual signup. Google OAuth may establish a session with an incomplete profile; collect phone and marketplace role after sign-in before allowing marketplace access.
   - Configure session cookie: `HttpOnly`, `Secure`, `SameSite=Lax`, 24-hour inactivity expiry. Refresh active sessions hourly (`updateAge: 1 hour`) so the inactivity expiry rolls forward during use.
   - Use Better Auth's built-in scrypt password hashing.

2. **Implement `authenticate` middleware**
   - `shared/middleware/authenticate.js` — Verifies session via Better Auth; attaches `req.user` (id, email, phone, role, status, profileComplete); returns 401 if invalid.
   - Rejects suspended users (checks `user.status === 'ACTIVE'`).
   - `shared/middleware/requireProfileComplete.js` — Blocks marketplace API access until phone and role are set, while leaving auth status, logout, and profile-completion routes available.

3. **Implement `authorize` middleware**
   - `shared/middleware/authorize.js` — Checks `req.user.role` against allowed roles; returns 403 if denied.

4. **Implement Auth module layers**
   Following [architecture.md § 3](./architecture/architecture.md) and [api.md § 5.1](./architecture/api.md):

   | Layer | File | Endpoints |
   |-------|------|-----------|
   | Route | `auth.routes.js` | POST `/auth/send-verification-code`, POST `/auth/register`, POST `/auth/login`, POST `/auth/logout`, POST `/auth/forgot-password`, POST `/auth/reset-password`, GET `/auth/verify-reset-token`, GET `/auth/me`, POST `/auth/complete-profile` |
   | Controller | `auth.controller.js` | |
   | Service | `auth.service.js` | |
   | Repository | `auth.repository.js` | |
   | Validation | `auth.validation.js` | Zod schemas for registration (FR-001), login (FR-002), password reset (FR-003) |

Better Auth's credential account is the sole password-hash store. Do not add a duplicate `passwordHash` field to `User`.

5. **Implement User/Profile endpoints**
   Per [api.md § 5.2](./architecture/api.md):

   | Method | Endpoint | Description |
   |--------|----------|-------------|
   | GET | `/users/:id` | Public profile |
   | PATCH | `/users/:id` | Update profile (owner only) (FR-005) |
   | POST | `/users/:id/profile-photo` | Upload profile photo (owner only) |
   | GET | `/users/:id/vehicle` | Vehicle details |
   | PUT | `/users/:id/vehicle` | Create/update vehicle (Transporter owner only) (FR-006) |
   | GET | `/users/:id/reviews` | Reviews received |

6. **Write Zod validation schemas**
   - Registration: name (required), email (valid format, unique), phone (required for manual signup), password (min 8, uppercase, lowercase, digit per [security.md § 2](./architecture/security.md)), verification code (6 digits, required). A verification code must be dispatched to the email via `POST /auth/send-verification-code` and validated before the user account is created. Enforce password rules on signup and reset. Use Better Auth's built-in scrypt hashing. Role must be SHIPPER or TRANSPORTER. The authenticated profile-completion endpoint requires phone and role for Google OAuth users.
   - Profile update: name, phone, location, profilePhoto (all optional).
   - Vehicle: type, capacityTons, plateNumber (all required).

7. **Rate-limit auth endpoints**
   - `/auth/login`, `/auth/register`: 10 req / 15 min per IP per [security.md § 8](./architecture/security.md).
   - `/auth/forgot-password`: 3 req / 15 min per IP.
   - `/auth/send-verification-code`: 5 req / 15 min per IP.

8. **Write tests**
   - Unit tests: auth service (registration validation, password hashing, duplicate email rejection).
   - Integration tests (Supertest): Registration, login, logout, profile update, vehicle CRUD, unauthorized access (401), forbidden access (403), suspended user rejection.

### Deliverables

- Complete `auth` module (`routes`, `controller`, `service`, `repository`, `validation`).
- `authenticate` and `authorize` middleware working and reusable by all modules.
- Integration test suite for all auth endpoints.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | User can register as Shipper or Transporter with valid data; receives 201 | Integration test |
| 2 | Duplicate email returns 409 | Integration test |
| 3 | Invalid registration data returns 400 with field-level Zod errors | Integration test |
| 4 | Login with valid credentials returns 200 and sets session cookie | Integration test |
| 5 | Login with invalid credentials returns 401 | Integration test |
| 6 | Logout destroys session; subsequent requests return 401 | Integration test |
| 7 | Password reset flow: request -> email token -> reset with new password works | Integration test (mock email) |
| 8 | `GET /auth/me` returns authenticated user profile | Integration test |
| 9 | Profile update works for owner; returns 403 for non-owner | Integration test |
| 10 | Vehicle CRUD works for Transporter; returns 403 for Shipper | Integration test |
| 11 | Rate limiter returns 429 after 10 login attempts in 15 minutes | Integration test |
| 12 | Suspended user cannot authenticate | Integration test |
| 13 | All tests pass in CI | CI pipeline |
| 14 | Google OAuth users can establish a session, see `profileComplete: false`, are blocked from marketplace routes, and can complete their profile to regain access | Integration test |

### User Actions Required

> Use a mocked email sender in Phase 3 tests. Brevo is the selected provider; configure its API key when Phase 6 implements notification email delivery. Set `BETTER_AUTH_SECRET` for local authentication when starting this phase.
>
> Configure a Google OAuth client and its local callback URL before testing Google sign-in. Store the client ID and secret in local environment variables, never in source control.
>
> Run the real Better Auth integration suite only against a dedicated, disposable test database: set `AUTH_INTEGRATION_DATABASE_URL` in `server/.env` and run `npm run test:auth:integration` from `server/`. The regular `npm test` command always skips these live database checks; the dedicated command enables them. The suite creates temporary auth records and removes them when it finishes.
>
> Apply the new profile-completion migration to the development database before testing Google OAuth there. Use `npx prisma migrate deploy` from `server/` with the development `DATABASE_URL`; keep the disposable integration branch configured separately in `AUTH_INTEGRATION_DATABASE_URL`.

---

## Phase 4: Shipment & Discovery Module

### Objective

Implement shipment CRUD, status lifecycle, image upload, and the search/browse/filter system for Transporters. This covers FR-100 through FR-107 and FR-200 through FR-205.

### Tasks

1. **Implement Shipment module layers**
   Per [api.md § 5.3](./architecture/api.md):

   | Method | Endpoint | Role | Description |
   |--------|----------|------|-------------|
   | POST | `/shipments` | Shipper | Create shipment (DRAFT) — FR-100, FR-101 |
   | GET | `/shipments` | Any authenticated | List/search — transporters see PUBLISHED; shippers see own — FR-200 |
   | GET | `/shipments/:id` | Any authenticated | Shipment detail |
   | PATCH | `/shipments/:id` | Shipper (owner) | Update fields — FR-102 |
   | PATCH | `/shipments/:id/publish` | Shipper (owner) | Publish DRAFT -> PUBLISHED — FR-104 |
   | PATCH | `/shipments/:id/cancel` | Shipper (owner) | Cancel shipment — FR-103 |
   | PATCH | `/shipments/:id/complete` | Shipper (owner) | IN_PROGRESS -> COMPLETED — FR-500 |
   | POST | `/shipments/:id/images` | Shipper (owner) | Upload images (max 5) — FR-105 |
   | DELETE | `/shipments/:id/images/:imageId` | Shipper (owner) | Remove image |

2. **Implement shipment status lifecycle**
   Enforce transitions per [functional-requirements.md § 2](./requirements/functional-requirements.md):
   ```
   DRAFT -> PUBLISHED -> IN_PROGRESS -> COMPLETED
                |               |
                +---> CANCELLED <-+
   ```
   - Reject invalid transitions in the service layer.
   - Editing allowed only in DRAFT or PUBLISHED with no accepted bid (FR-102).
   - Cancellation from any status except COMPLETED; auto-decline pending bids (FR-103).

3. **Implement search and filtering**
   Per FR-200 through FR-205:
   - Filter by: `pickupLocation`, `deliveryLocation`, `goodsType`, date range. Standardized load categories: Agriculture, Construction, Food Products, Beverage, Other.
   - Text search across `goodsDescription` and `specialRequirements` (FR-204).
   - Sort by: `createdAt` desc (default), `pickupDate`. Defer distance sorting: the current Transporter profile stores location as free text, not coordinates, so calculating reliable distance requires a separate location data/design decision.
   - Pagination per [api.md § 7](./architecture/api.md): `?page=1&limit=20`, response includes `meta.pagination`.

4. **Implement image upload**
   - Use `multer` for multipart handling.
   - Validate MIME type (JPEG, PNG, WebP) and size (max 5 MB per file) per [security.md § 9](./architecture/security.md).
   - Upload to Cloudinary; store URL in `ShipmentImage`.
   - Enforce max 5 images per shipment (FR-105).
   - Rate limit: 20 uploads / 1 min per user per [security.md § 8](./architecture/security.md).

5. **Implement ownership checks**
   - Service layer verifies `shipment.shipperId === req.user.id` for all mutation operations per [security.md § 3](./architecture/security.md).

6. **Write Zod validation schemas**
   - Create shipment schema per [api.md § 6](./architecture/api.md).
   - Update shipment schema (all fields optional).
   - Search/filter query parameter schema.

7. **Write tests**
   - Unit tests: status lifecycle transitions (valid and invalid), ownership checks.
   - Integration tests: full CRUD, publish, cancel, complete; search with various filters; image upload + deletion; unauthorized access.

### Deliverables

- Complete `shipment` module.
- Image upload pipeline to external storage.
- Search/filter/pagination working.
- Integration test suite.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Shipper can create a shipment in DRAFT status | Integration test |
| 2 | Shipper can publish, edit, cancel, and complete a shipment following valid transitions | Integration test |
| 3 | Invalid status transitions return 422 | Integration test |
| 4 | Non-owner cannot edit/cancel/complete a shipment (returns 403) | Integration test |
| 5 | Transporter cannot create a shipment (returns 403) | Integration test |
| 6 | `GET /shipments` returns paginated PUBLISHED shipments for Transporters | Integration test |
| 7 | Filters (goods type, pickup location, delivery location, date range) work correctly | Integration test |
| 8 | Text search finds shipments by goods description keywords | Integration test |
| 9 | Image upload succeeds with valid file; returns URL | Integration test |
| 10 | Image upload rejects invalid MIME type or oversized file (returns 400) | Integration test |
| 11 | Maximum 5 images enforced per shipment | Integration test |
| 12 | Cancelled shipments not visible in Transporter search results | Integration test |
| 13 | All tests pass in CI | CI pipeline |

### User Actions Required

> Cloudinary is the selected provider. Configure the Cloudinary account and `CLOUDINARY_URL` when implementing image upload in this phase. Use a mock in tests when testing does not require a real upload.

---

## Phase 5: Bid Module

### Objective

Implement the bidding workflow — bid submission, update, withdrawal, acceptance, and decline — with all business rules and cross-module interactions specified in FR-300 through FR-308.

### Tasks

1. **Implement Bid module layers**
   Per [api.md § 5.4](./architecture/api.md):

   | Method | Endpoint | Role | Description |
   |--------|----------|------|-------------|
   | POST | `/shipments/:shipmentId/bids` | Transporter | Submit bid — FR-300, FR-301 |
   | GET | `/shipments/:shipmentId/bids` | Shipper (owner) | List bids on shipment — FR-303 |
   | GET | `/bids/my` | Transporter | List own bids across shipments |
   | GET | `/shipments/:shipmentId/bids/:id` | Owner (Shipper or Transporter) | Bid detail |
   | PATCH | `/shipments/:shipmentId/bids/:id` | Transporter (owner) | Update bid — FR-302 |
   | PATCH | `/shipments/:shipmentId/bids/:id/withdraw` | Transporter (owner) | Withdraw bid — FR-302 |
   | PATCH | `/shipments/:shipmentId/bids/:id/accept` | Shipper (shipment owner) | Accept bid — FR-304 |
   | PATCH | `/shipments/:shipmentId/bids/:id/decline` | Shipper (shipment owner) | Decline bid — FR-306 |

2. **Implement business rules**
   - Bid only on PUBLISHED shipments (FR-300).
   - One active bid per Transporter per shipment (FR-308).
   - Update/withdraw only PENDING bids owned by the Transporter (FR-302).
   - Accept: update bid to ACCEPTED, decline all other PENDING bids, transition shipment to IN_PROGRESS (FR-304, FR-305) — cross-module call to Shipment service per [architecture.md § 5.2](./architecture/architecture.md).
   - Decline: update bid to DECLINED with optional reason (FR-306).
   - Cancelling a shipment auto-declines all pending bids (implemented in Shipment service, but verified here).

3. **Bid status lifecycle**
   ```
   PENDING -> ACCEPTED
       |---> DECLINED
       +---> WITHDRAWN
   ```

4. **Write Zod validation schemas**
   - Create bid: `price` (positive number), `pickupDate` (future datetime), `message` (optional text).
   - Update bid: same fields, all optional.
   - Decline bid: `declineReason` (optional text).

5. **Write tests**
   - Unit tests: bid business rules (duplicate bid prevention, invalid status transitions, ownership).
   - Integration tests: full bid lifecycle (submit -> accept, submit -> decline, submit -> withdraw), cross-module effects (shipment status change on accept, auto-decline on shipment cancel).

### Deliverables

- Complete `bid` module.
- Cross-module integration with `shipment` module working.
- Integration test suite.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Transporter can submit a bid on a PUBLISHED shipment; receives 201 | Integration test |
| 2 | Duplicate bid on same shipment returns 409 | Integration test |
| 3 | Bid on non-PUBLISHED shipment returns 422 | Integration test |
| 4 | Shipper cannot submit a bid (403) | Integration test |
| 5 | Transporter can update and withdraw own PENDING bid | Integration test |
| 6 | Shipper can accept a bid: bid becomes ACCEPTED, others DECLINED, shipment -> IN_PROGRESS | Integration test |
| 7 | Shipper can decline a bid with reason: bid becomes DECLINED, Transporter receives decline reason | Integration test |
| 8 | Cancelling a shipment auto-declines all pending bids | Integration test |
| 9 | `GET /bids/my` returns the Transporter's bids across all shipments | Integration test |
| 10 | All tests pass in CI | CI pipeline |

### User Actions Required

> No additional user actions required for this phase.

---

## Phase 6: Messaging, Notifications, Reviews & Admin

### Objective

Implement the remaining backend modules — messaging (FR-400-403), notifications (FR-700-701), reviews (FR-500-503), and admin (FR-600-604). These are grouped because they are less interdependent and can be built in parallel within this phase.

### Tasks

#### 6A. Messaging Module

1. **Implement Messaging module layers**
   Per [api.md § 5.5](./architecture/api.md):

   | Method | Endpoint | Role | Description |
   |--------|----------|------|-------------|
   | GET | `/messages/conversations` | Shipper or Transporter | List the current user's private shipment conversations |
   | GET | `/messages/conversations/:conversationId` | Conversation participant | Read the conversation history |
   | GET | `/messages/conversations/:conversationId/bids` | Conversation participant | List bids and shipment context for the participant pair |
   | POST | `/messages/conversations/:conversationId` | Conversation participant | Send a private message |

2. **Implement access control**
   - Each shipper/transporter pair has one private conversation independent of bids and shipments.
   - Transporters only see their own conversations. Chat remains readable and writable regardless of bid status; bid navigation changes only the bid context panel.
   - Service layer verifies participant identity for list, read, and send operations.
   - New message notifications and email are sent only to the other participant in that private conversation.

3. **Write tests**
   - Authorized parties can exchange messages.
   - Unauthorized party (no bid on shipment) gets 403.
   - Messages are persisted and returned in chronological order.

#### 6B. Notification Module

1. **Implement Notification service (internal — no routes exposed for dispatch)**
   Per [architecture.md § 2.1](./architecture/architecture.md) — the notification module is internal-only, consumed by other modules.

2. **Implement notification types**
   Per FR-700:
   - `BID_RECEIVED` — sent to Shipper when Transporter submits a bid.
   - `BID_ACCEPTED` — sent to Transporter when bid is accepted.
   - `BID_DECLINED` — sent to Transporter when bid is declined.
   - `NEW_MESSAGE` — sent to recipient when a new message is sent.
   - `SHIPMENT_COMPLETED` — sent to Transporter when shipment is completed.

3. **Implement email dispatch**
   - For each notification type, dispatch an email using the configured email provider.
   - Store notification record in the `Notification` table.

4. **Implement Notification API endpoints**
   Per [api.md § 5.6](./architecture/api.md):

   | Method | Endpoint | Description |
   |--------|----------|-------------|
   | GET | `/notifications` | Get current user's notifications |
   | PATCH | `/notifications/:id/read` | Mark notification as read |
   | PATCH | `/notifications/read-all` | Mark all notifications as read |

5. **Integrate notifications into existing modules**
   - Add `NotificationService.send()` calls in: `bid.service.js` (bid submitted, accepted, declined), `messaging.service.js` (new message).

6. **Write tests**
   - Notifications are created on bid events.
   - Email dispatch is called (mock email provider in tests).
   - User can fetch and mark notifications as read.

#### 6C. Review Module

1. **Implement Review endpoints**
   Per [api.md § 5.7](./architecture/api.md):

   | Method | Endpoint | Role | Description |
   |--------|----------|------|-------------|
   | POST | `/shipments/:shipmentId/reviews` | Participant | Create review after COMPLETED — FR-501 |
   | GET | `/shipments/:shipmentId/reviews` | Any | Get reviews for shipment |

2. **Implement business rules**
   - Only participants (Shipper or accepted Transporter) of a COMPLETED shipment can leave a review.
   - One review per user per shipment (unique constraint).
   - Reviews are immutable (no UPDATE endpoint) — FR-503.
   - Rating: 1-5 stars, comment optional — FR-501.

3. **Implement average rating on user profiles**
   - `GET /users/:id/reviews` returns reviews and computed average rating (FR-502).
   - Update `GET /users/:id` to include averageRating and reviewCount.

4. **Write tests**
   - Review creation by participant of completed shipment.
   - Duplicate review rejection (409).
   - Review by non-participant rejected (403).
   - Review on non-completed shipment rejected (422).
   - Reviews are immutable (no update endpoint).

#### 6D. Admin Module

1. **Implement Admin module layers**
   Per [api.md § 5.8](./architecture/api.md) — all endpoints require `ADMIN` role:

   | Method | Endpoint | Description |
   |--------|----------|-------------|
   | GET | `/admin/users` | List all users with search/filter — FR-600 |
   | PATCH | `/admin/users/:id/suspend` | Suspend user — FR-601 |
   | PATCH | `/admin/users/:id/activate` | Reactivate user — FR-601 |
   | GET | `/admin/shipments` | List all shipments with status filter — FR-602 |
   | PATCH | `/admin/shipments/:id/remove` | Remove listing with reason, audit action, close pending bids, notify affected transporters — FR-603 |
   | GET | `/admin/metrics` | Platform metrics — FR-604 |

2. **Implement metrics**
   - Total users by role.
   - Active, completed, cancelled shipment counts.
   - New registrations in last 30 days.

3. **Write tests**
   - Admin can list/search users, filter by role and status.
   - Admin can suspend users with a recorded reason and reactivate them (which clears the reason).
   - Suspended user cannot log in.
   - Admin can view and remove shipments.
   - Non-admin users get 403 on all admin endpoints.
   - Metrics endpoint returns correct aggregate counts.

### Deliverables

- Complete `messaging`, `notification`, `admin` modules.
- Review endpoints in `shipment` module (or standalone module).
- Email notification integration (with mock for testing).
- Integration test suites for all four areas.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Conversation participants can send and retrieve a continuous private chat independent of bid or shipment context | Integration test |
| 2 | Unauthorized messaging attempts return 403 | Integration test |
| 3 | Notifications are created on bid and message events | Integration test |
| 4 | Email dispatch is triggered for notification events (verified via mock) | Integration test |
| 5 | User can fetch and mark notifications as read | Integration test |
| 6 | Participant can leave a review on a COMPLETED shipment | Integration test |
| 7 | Duplicate review and non-participant review are rejected | Integration test |
| 8 | User profile includes average rating and review count | Integration test |
| 9 | Admin can list, search, suspend, and reactivate users | Integration test |
| 10 | Admin can view and remove shipment listings | Integration test |
| 11 | Admin metrics return correct counts | Integration test |
| 12 | Non-admin access to admin endpoints returns 403 | Integration test |
| 13 | All tests pass in CI | CI pipeline |

### User Actions Required

> Brevo is the selected provider. Configure a Brevo API key and verified sender for the email integration in this phase. Keep credentials in environment variables and use a mocked sender in automated tests.

---

## Phase 7: Frontend Implementation

### Objective

Build the complete React frontend — all pages, components, API integration, and client-side validation — covering all user-facing requirements and the UI specifications from [srs.md § 4.1](./requirements/srs.md), [architecture.md § 7](./architecture/architecture.md), and the usability NFRs (NFR-200 through NFR-205).

### Tasks

#### 7A. Frontend Foundation

1. **Set up design system**
   - Configure Tailwind CSS and define reusable color, typography, spacing, surface, and component tokens.
   - Use the user-provided UXPilot PDF as the preferred visual reference: EthioFreight branding, cobalt-blue primary actions and headers, dark navy navigation, cool light-gray page surfaces, white cards, compact rounded controls, and restrained shadows. Match its page designs closely where they cover a planned workflow, and carry the same visual language into pages not shown.
   - Use Inter as the primary typeface and keep the shared design responsive at the required widths.
   - Implement shared UI components in `client/src/shared/components/`:
     - `Button`, `Input`, `Textarea`, `Select`, `Modal`, `Card`, `Badge`, `Alert/Toast`, `Spinner/Skeleton`, `Pagination`.
   - Responsive breakpoints per NFR-200 (320px, 768px, 1920px).

2. **Set up API client**
   - `client/src/shared/api/client.js` — Axios/fetch wrapper with base URL (`VITE_API_BASE_URL`), credentials (cookies), error interceptors per [architecture.md § 7.3](./architecture/architecture.md).
   - TanStack Query provider in `App.jsx`.

3. **Set up routing**
   - React Router v6 with route protection (redirect unauthenticated users to login).
   - Role-based route guards (Shipper, Transporter, Admin dashboards).

4. **Set up context**
   - `AuthContext` — stores current user, `login()`, `logout()`, `isAuthenticated` per [architecture.md § 7.2](./architecture/architecture.md).

#### 7B. Auth Pages

1. **Registration page** — Role selection (Shipper/Transporter), form with client-side Zod validation, error display per NFR-202.
2. **Login page** — Email + password form.
3. **Google OAuth profile completion** — After Google sign-in, collect phone and marketplace role for incomplete profiles; keep protected marketplace routes gated until the API reports `profileComplete: true`.
4. **Forgot password page** — Email input, success message.
5. **Reset password page** — New password form (from email link).
6. **Profile page** — View and edit profile, upload profile photo. Transporter: vehicle details form.

#### 7C. Shipper Pages

1. **Shipper dashboard** — Overview of own shipments (by status), received bids count, messages per FR-107. The authenticated dashboard summary endpoint provides these totals and the latest five shipments; message totals are cumulative, not unread counts.
2. **Create/Edit shipment form** — All fields from FR-101, pickup and delivery city selectors backed by the shared Ethiopia city list (excluding pickup from delivery choices), date picker, image upload (drag-and-drop or file input), save as draft or publish.
3. **Shipment detail page** — Full info, images, status badge, action buttons (publish, cancel, complete), list of received bids with Transporter profile/rating, accept/decline bid buttons.
4. **My shipments list** — Paginated, filterable by status through the shipper-scoped `status` query on `GET /shipments`.

#### 7D. Transporter Pages

1. **Transporter dashboard** — Overview of submitted bids (by status), available shipments count, and recent shipment-message notifications.
2. **Shipment discovery page** — Paginated list + map view (Leaflet) of PUBLISHED shipments, filter sidebar (pickup location, delivery location, goods type, date range), search bar per FR-200-205.
3. **Shipment detail page** — Full info, bid form (if no active bid), own bid status/details, and a messaging thread for transporters with a pending or accepted bid.
4. **My bids list** — Paginated, filterable by status; the `/bids/my` endpoint also supports filtering to one shipment.

#### 7E. Admin Pages

1. **Admin dashboard** — Metrics cards (total users by role, shipment counts, recent registrations) per FR-604.
2. **User management page** — Paginated user table, search by name/email, filter by role/status, suspend/activate actions per FR-600, FR-601.
3. **Shipment management page** — Paginated shipment table, filter by status, remove action per FR-602, FR-603.

#### 7F. Common Features

1. **Notification dropdown/page** — List of notifications, accurate unread count, mark one or all as read, click to navigate.
2. **Map components** — Shared Leaflet canvas with marker placement for location selection and shipment discovery per FR-203.
3. **Messaging UI** — Dedicated shipper and transporter Messages pages with searchable conversation lists, chronological private chat history, shipment context, and links from shipment details. Conversations refresh automatically while open.
4. **Loading States** — Skeletons and spinners per NFR-205.
5. **Error handling** — Global toast for network failures, inline API errors and form validation per NFR-202.

#### 7G. Frontend Testing

1. **Component tests** (Vitest) — Key shared components render correctly.
2. **Page-level integration** — Major workflows render with mocked API data.
3. **E2E tests** (Playwright) — Critical user journeys:
   - Registration -> Login -> Create Shipment -> Publish.
   - Browse Shipments -> Submit Bid -> Accept Bid -> Complete -> Review.
   - Admin: Login -> Suspend User -> Verify login blocked.

**Implementation status:** The client has Vitest render tests for shared controls and mocked Playwright flows for shipper registration/shipment publishing, transporter login/bid submission, shipper bid acceptance/completion/review, and admin user suspension with suspended-account login rejection. Admin dashboard and user management screens use the existing authenticated admin APIs. Shipment review forms are available to eligible participants after completion. Admin shipment moderation UI remains outstanding under 7E.

**User Action/Dependency:** Install Playwright Chromium with `npx playwright install chromium` before running `npm run test:e2e`. The browser binary is not installed in the current environment.

### Deliverables

- Complete React frontend matching all specified pages and flows.
- Responsive across 320px, 768px, 1920px.
- Component library and design system.
- E2E test suite covering critical paths.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Registration flow works end-to-end (Shipper and Transporter) | E2E test |
| 2 | Login/logout works; session persists across page refreshes | E2E test |
| 3 | Shipper can create, edit, publish, cancel, and complete a shipment via UI | E2E test |
| 4 | Transporter can browse, search, filter shipments and see map markers | E2E test |
| 5 | Transporter can submit, update, and withdraw a bid via UI | E2E test |
| 6 | Shipper can view bids, accept one, decline others via UI | E2E test |
| 7 | Messaging works between authorized parties | E2E test |
| 8 | Review submission after shipment completion works | E2E test |
| 9 | Admin dashboard shows metrics, user management, and shipment moderation work | E2E test |
| 10 | All forms show inline validation errors per NFR-202 | Manual + E2E test |
| 11 | Loading states displayed during data fetching (no blank screens) per NFR-205 | Manual inspection |
| 12 | Responsive layout works at 320px, 768px, and 1920px per NFR-200 | Manual inspection |
| 13 | Interactive elements have visible focus and hover states per NFR-204 | Manual inspection |
| 14 | `npm run build` in `client/` produces a production bundle without errors | Build command |
| 15 | All Playwright E2E tests pass | CI pipeline |

### User Actions Required

> Use the user-provided `uxpilot-export-10-09-26.pdf` as the brand and visual reference for all frontend pages. Follow its EthioFreight branding and page designs as closely as the documented product requirements and architecture allow, including for pages not represented in the PDF. Implement the planned frontend in phase order rather than building every PDF screen at once. The documented goods categories and Addis Ababa map center remain the current product defaults.

---

## Phase 8: QA, Security Hardening & Production Deployment

### Objective

Perform comprehensive quality assurance, apply all security hardening measures, deploy to production environments, and verify the live system meets all NFRs.

### Tasks

#### 8A. Security Hardening

1. **Verify all items on [security.md § 13](./architecture/security.md) Security Review Checklist:**
   - All endpoints require authentication unless explicitly public.
   - RBAC middleware on every route group.
   - Ownership checks in service layer for resource mutations.
   - Zod validation schemas cover all request inputs.
   - No raw SQL — all queries via Prisma.
   - Passwords never logged or in API responses.
   - Rate limiting active on auth and upload routes.
   - CORS restricted to frontend origin.
   - Helmet security headers enabled.
   - Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax`.
   - `npm audit` passes with no high/critical findings.
   - `.env` in `.gitignore`.
   - Error responses in production don't leak internals.
   - File upload MIME type and size validation active.

2. **Run `npm audit`** and fix any high/critical vulnerabilities.

3. **Review CORS configuration** — ensure only the production frontend origin is allowed.

4. **Review rate limiting** — verify all limits match [security.md § 8](./architecture/security.md).

**Progress (2026-10-10):** Code review found and fixed two disclosure risks: HTTP access logs now record the request path without query parameters, and production 5xx responses omit attached error details. `npm audit` reports no vulnerabilities in `client/`; the server has 7 high and 0 critical findings. The registry's automatic remediation proposes downgrading Prisma 7 to 6.19.3 and Nodemon 3 to 1.14.10, which would change the established toolchain. No dependency changes were made; resolve this with a compatible upstream patch or an explicitly approved dependency strategy before marking the audit complete.

#### 8B. Quality Assurance

**Progress (2026-10-10):** Server and client ESLint pass; client Vitest passes (2 tests), and the client production build succeeds with a warning that the main JavaScript chunk is 695.31 kB minified. The server Vitest suite is not green: under the sandbox it failed in default mode with temporary bundled-module `ENOENT` errors; a single-worker run confirmed 65 failures and 11 failed files, primarily because local Supertest sockets are denied (`EACCES`), Neon connections are unavailable, and Cloudinary configuration is invalid for a user-service suite. 44 tests passed and 3 were skipped in that run. On follow-up, `npx playwright test` launched Chromium and the Vite test server but did not return results before it was stopped; no report artifacts were produced. Auth integration tests, explicitly enabled by the local `server/.env`, remain blocked: with a temporary valid-format Cloudinary placeholder they timed out in setup before executing tests. No database writes were knowingly made. Source review shows global focus-visible styles and reusable loading indicators; responsive breakpoints exist, but actual 320px/768px/1920px workflow verification and keyboard accessibility need browser execution. Performance targets and query plans have not been measured against a running API/database.

1. **Run full test suite** — all unit, integration, and E2E tests pass.

2. **Performance testing (manual):**
   - Verify API response times are within NFR-001 (p95 <= 500ms).
   - Verify search pages render within NFR-002 (TTI <= 2s).
   - Confirm no full table scans on primary queries (NFR-004).

3. **Cross-browser testing:**
   - Chrome, Firefox, Safari, Edge (latest two major versions) per SRS § 2.4.

4. **Responsive testing:**
   - Verify all core workflows at 320px, 768px, 1920px per NFR-200.

5. **Accessibility check:**
   - Focus states visible per NFR-204.
   - Keyboard navigation for core workflows.

#### 8C. API Documentation

**Progress (2026-10-10):** Added an OpenAPI 3.1 document covering 37 paths and 45 operations across implemented API groups, including request inputs, cookie authentication, and standard responses. Added `/api/docs` Swagger UI and `/api/docs/json`. Verified all operation parameter/response component references and confirmed server ESLint passes. Updated deployment docs and root `.env.example` to include Better Auth URL and Google OAuth configuration required by the implemented auth provider.

1. **Generate/finalize OpenAPI specification** per [api.md § 9](./architecture/api.md).
   - All endpoints documented with request/response schemas.
   - Swagger UI available at `/api/docs`.
   - JSON spec at `/api/docs/json`.

2. **Verify `.env.example`** is complete with all variables from [deployment.md § 2](./architecture/deployment.md).

#### 8D. Production Deployment

1. **Use Neon PostgreSQL**
   - Use the existing Neon project, with separate development and production branches or databases.
   - Run `npx prisma migrate deploy` against the production Neon connection only during deployment.
   - Seed initial admin user.

2. **Deploy backend (selected provider)**
   - Configure a Node.js Web Service per [deployment.md § 5](./architecture/deployment.md).
   - Set all environment variables (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `CORS_ORIGIN`, storage credentials, `NODE_ENV=production`, etc.).
   - Configure health check path: `/api/v1/health`.
   - Verify `prestart` script runs migrations.

3. **Deploy frontend (Vercel)**
   - Connect GitHub repo to Vercel per [deployment.md § 4](./architecture/deployment.md).
   - Set root directory to `client/`.
   - Set `VITE_API_BASE_URL` to the production API URL.
   - Configure SPA rewrite.

4. **Configure DNS (if applicable).**

5. **Verify production deployment:**
   - Health check endpoint responds.
   - Registration + login flow works.
   - Shipment creation and browsing works.
   - Bid submission and acceptance works.
   - Image upload works (to production Cloudinary).
   - Emails are sent (password reset, bid notifications).

#### 8E. Production Readiness Checklist

Verify all items from [deployment.md § 12](./architecture/deployment.md):

| # | Item |
|---|------|
| 1 | All environment variables set in production |
| 2 | `NODE_ENV=production` on the selected API host |
| 3 | CORS origin restricted to frontend domain |
| 4 | HTTPS enforced |
| 5 | Database migrations applied |
| 6 | Seed data excluded in production |
| 7 | Rate limiting configured and tested |
| 8 | Health check endpoint responding |
| 9 | Structured logging active (no `console.log`) |
| 10 | Error handler returns generic messages in production |
| 11 | `npm audit` passes |
| 12 | Helmet security headers enabled |
| 13 | Database backups verified |
| 14 | Uptime monitoring configured |
| 15 | `.env` file is in `.gitignore` |

#### 8F. Monitoring Setup

1. **Set up uptime monitoring** — UptimeRobot or similar pinging `GET /api/v1/health` every 5 minutes per [deployment.md § 9](./architecture/deployment.md).
2. **Configure alerting** — API down, high error rate, database connection failure per [deployment.md § 9](./architecture/deployment.md).
3. **Verify logging** — Structured JSON logs are being produced in production.

### Deliverables

- Production system live and accessible.
- All security checklist items verified.
- API documentation (Swagger UI) live.
- Monitoring and alerting configured.
- Full test suite green in CI.

### Completion Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| 1 | Production health check returns 200 | HTTP request to production URL |
| 2 | Full registration -> shipment -> bid -> accept -> complete -> review flow works in production | Manual smoke test |
| 3 | Security review checklist (14 items) all pass | Manual verification |
| 4 | Production readiness checklist (15 items) all pass | Manual verification |
| 5 | API response times p95 <= 500ms under test load | Performance measurement |
| 6 | Swagger UI accessible at `/api/docs` with all endpoints documented | Manual verification |
| 7 | Uptime monitoring is active and alerting works | Test alert |
| 8 | `npm audit` reports no high/critical vulnerabilities | CI pipeline |
| 9 | All E2E tests pass against production (or staging) | CI pipeline or manual |

### User Actions Required

> **Production deployment requires the following from you:**
>
> 1. **API hosting account:** Choose and configure the API hosting provider, then provide its production environment configuration.
> 2. **Vercel account:** Create an account at vercel.com. Connect your GitHub repository. Configure the project root as `client/`.
> 3. **Domain name (optional):** If you want a custom domain, purchase and configure DNS. Otherwise, use the default domains provided by the selected hosting services.
> 4. **Neon production connection:** Create or select the production branch/database and configure its connection string securely in the API host.
> 5. **Transactional email delivery:** Configure the Brevo API key and verified sender address on the API host.
> 6. **Production file storage:** Ensure the selected storage account is production-ready and configure its credentials on the API host.
> 7. **Production `BETTER_AUTH_SECRET`:** Generate a new, strong 64-character random string for production. Do NOT reuse the development secret.
> 8. **Uptime monitoring:** Create an account on UptimeRobot (or similar) and configure a monitor for the production health check endpoint. Provide an email/Slack webhook for alerts.
> 9. **Initial admin account:** Provide the email and password for the first production admin user, which will be seeded during deployment.
> 10. **GitHub Actions test database:** Choose an isolated test database: a dedicated Neon test branch/connection string in repository secrets, or an ephemeral PostgreSQL service in GitHub Actions. Never point CI at development or production data.

---

## Summary

| Phase | Focus | Key Requirement Coverage |
|-------|-------|--------------------------|
| 1 | Setup & Foundation | NFR-400, NFR-402, NFR-404, NFR-600, NFR-601 |
| 2 | Database | All entity definitions from database.md |
| 3 | Auth | FR-001-008, NFR-100-109 |
| 4 | Shipment & Search | FR-100-107, FR-200-205, FR-500 |
| 5 | Bid | FR-300-308 |
| 6 | Messaging/Notif/Reviews/Admin | FR-400-403, FR-500-503, FR-600-604, FR-700-701 |
| 7 | Frontend | All user stories, NFR-200-205 |
| 8 | Deploy & QA | NFR-001-005, NFR-300-304, production checklist |

### User Dependencies

Neon, Cloudinary, and Brevo are the selected services. Any credentials, accounts, or external setup are called out only inside the phase that first needs them; no future-phase setup is requested in advance. Node.js version is not a project decision or Phase 1 completion requirement.

---

> **Document Control**  
> This plan is a living document. It will be updated if implementation reveals that documented requirements, architecture, or assumptions need revision. All significant changes will be recorded in commits tracked via Git.
