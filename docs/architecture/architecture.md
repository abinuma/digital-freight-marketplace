# System Architecture

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Pattern:** Modular Monolith + Layered Architecture  

---

## 1. Architecture Overview

The Digital Freight Marketplace is architected as a **Modular Monolith** — a single deployable application organized into discrete, well-bounded modules that communicate through explicit in-process interfaces. Each module follows a **Layered Architecture** pattern internally.

This approach provides the organizational benefits of modular design (clear boundaries, independent development per feature area) without the operational overhead of distributed systems. Modules can be extracted into separate services in the future if scale demands it.

### System Context

```
┌─────────────┐          ┌──────────────┐          ┌──────────────────┐
│   Shipper   │          │  Transporter │          │      Admin       │
│  (Browser)  │          │  (Browser)   │          │    (Browser)     │
└──────┬──────┘          └──────┬───────┘          └────────┬─────────┘
       │                        │                           │
       └────────────┬───────────┘───────────────────────────┘
                    │ HTTPS
                    ▼
       ┌────────────────────────┐
       │   React Frontend       │     Vercel
       │   (Vite + Tailwind)    │
       └────────────┬───────────┘
                    │ REST API calls
                    ▼
       ┌────────────────────────┐
       │   Express.js Backend   │     Render
       │   (Modular Monolith)   │
       └─────┬──────────┬──────┘
             │          │
             ▼          ▼
       ┌──────────┐ ┌──────────┐
       │PostgreSQL│ │Cloudinary│     External services
       │          │ │  / S3    │
       └──────────┘ └──────────┘
```

---

## 2. Modular Monolith Structure

### 2.1 Module Boundaries

Each module encapsulates a distinct business domain. Modules own their routes, business logic, and data access. Cross-module communication happens through direct function calls within the same process — no HTTP or message queues between modules.

| Module | Domain | Responsibility |
|--------|--------|---------------|
| **auth** | Identity & Access | Registration, login, sessions, password reset, profile management |
| **shipment** | Freight Listings | Shipment CRUD, status lifecycle, image attachments |
| **bid** | Bidding | Bid creation, withdrawal, acceptance, decline |
| **messaging** | Communication | Shipment-contextual messaging between parties |
| **notification** | Alerts | Email and in-app notification dispatch |
| **admin** | Platform Management | User moderation, shipment moderation, metrics |

### 2.2 Module Interaction Rules

1. **Modules do not import each other's internal layers directly.** A module exposes a public service interface that other modules consume.
2. **Each module owns its own data.** No module writes directly to another module's database tables. Cross-module reads are allowed through the owning module's service layer.
3. **Shared infrastructure** (database client, middleware, utilities) lives in a `shared/` directory accessible by all modules.

### 2.3 Module Dependency Graph

```
  notification
      ▲
      │ (sends alerts)
      │
  ┌───┴────┐
  │  bid   │──────► shipment
  └───┬────┘            ▲
      │                 │
      │            messaging
      │
      ▼
    auth ◄──── admin
```

- `bid` depends on `shipment` (to validate shipment status) and `auth` (to identify the Transporter).
- `messaging` depends on `auth` for participant identity. It reads bid/shipment data only for the separate context panel; chat messages belong to the participant conversation, not to bids or shipments.
- `notification` is consumed by `bid` and `shipment` (to send alerts on events).
- `admin` depends on `auth` and `shipment` for moderation operations.

---

## 3. Layered Architecture (Per Module)

Each module is organized into four layers. Dependencies flow **downward only** — upper layers depend on lower layers, never the reverse.

```
┌─────────────────────────────────────┐
│          Route Layer                │   ← HTTP route definitions
│    Express router + validation      │
├─────────────────────────────────────┤
│          Controller Layer           │   ← Request/response handling
│    Parse input, call service,       │
│    format response                  │
├─────────────────────────────────────┤
│          Service Layer              │   ← Business logic
│    Domain rules, orchestration,     │
│    cross-module calls               │
├─────────────────────────────────────┤
│          Repository Layer           │   ← Data access
│    Prisma queries, data mapping     │
└─────────────────────────────────────┘
```

### 3.1 Layer Responsibilities

| Layer | Responsibility | Allowed Dependencies |
|-------|---------------|---------------------|
| **Route** | Define HTTP endpoints, attach middleware (auth, validation), delegate to controller | Controller, Shared middleware |
| **Controller** | Parse and validate request data, call service methods, format HTTP responses, handle errors | Service |
| **Service** | Implement business rules and domain logic, orchestrate operations, call other modules' services when needed | Repository, other modules' Service layer |
| **Repository** | Execute database queries via Prisma, return plain data objects | Prisma Client (shared) |

### 3.2 Layer Rules

- **Route layer** never contains business logic. It only wires middleware and delegates.
- **Controller layer** never queries the database directly. It never calls another module.
- **Service layer** is the only layer that may call into other modules (via their exposed service functions).
- **Repository layer** never throws HTTP-specific errors. It returns data or throws domain-level errors.

---

## 4. Project Structure

```
server/
├── src/
│   ├── app.js                          # Express app setup, middleware registration
│   ├── server.js                       # Server entry point, port binding
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js          # Route definitions
│   │   │   ├── auth.controller.js      # Request/response handling
│   │   │   ├── auth.service.js         # Business logic
│   │   │   ├── auth.repository.js      # Data access
│   │   │   └── auth.validation.js      # Zod schemas for this module
│   │   │
│   │   ├── shipment/
│   │   │   ├── shipment.routes.js
│   │   │   ├── shipment.controller.js
│   │   │   ├── shipment.service.js
│   │   │   ├── shipment.repository.js
│   │   │   └── shipment.validation.js
│   │   │
│   │   ├── bid/
│   │   │   ├── bid.routes.js
│   │   │   ├── bid.controller.js
│   │   │   ├── bid.service.js
│   │   │   ├── bid.repository.js
│   │   │   └── bid.validation.js
│   │   │
│   │   ├── messaging/
│   │   │   ├── messaging.routes.js
│   │   │   ├── messaging.controller.js
│   │   │   ├── messaging.service.js
│   │   │   ├── messaging.repository.js
│   │   │   └── messaging.validation.js
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.service.js     # No routes — internal module
│   │   │   └── notification.repository.js
│   │   │
│   │   └── admin/
│   │       ├── admin.routes.js
│   │       ├── admin.controller.js
│   │       ├── admin.service.js
│   │       ├── admin.repository.js
│   │       └── admin.validation.js
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── authenticate.js         # Session verification
│   │   │   ├── authorize.js            # Role-based access check
│   │   │   ├── validate.js             # Zod schema validation
│   │   │   ├── rateLimiter.js          # Rate limiting
│   │   │   └── errorHandler.js         # Global error handler
│   │   │
│   │   ├── utils/
│   │   │   ├── logger.js               # Structured logging
│   │   │   ├── AppError.js             # Custom error class
│   │   │   └── pagination.js           # Pagination helpers
│   │   │
│   │   ├── config/
│   │   │   └── index.js                # Environment variable loading
│   │   │
│   │   └── db/
│   │       └── prisma.js               # Shared Prisma client instance
│   │
│   └── index.js                        # Module registration, route mounting
│
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Versioned migrations
│
├── tests/
│   ├── unit/                           # Unit tests per module
│   ├── integration/                    # API integration tests
│   └── e2e/                            # End-to-end tests
│
├── .env.example
├── Dockerfile
├── docker-compose.yml
└── package.json
```

```
client/
├── src/
│   ├── main.jsx                        # App entry point
│   ├── App.jsx                         # Root component, routing
│   │
│   ├── features/
│   │   ├── auth/                       # Login, register, profile pages + components
│   │   ├── shipments/                  # Shipment listing, detail, create/edit
│   │   ├── bids/                       # Bid components (form, list)
│   │   ├── messaging/                  # Message thread components
│   │   └── admin/                      # Admin dashboard, moderation
│   │
│   ├── shared/
│   │   ├── components/                 # Reusable UI components (Button, Input, Modal, etc.)
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── context/                    # React Context providers
│   │   ├── api/                        # API client (axios/fetch wrappers)
│   │   └── utils/                      # Utility functions
│   │
│   └── assets/                         # Static assets (images, icons)
│
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 5. Data Flow

### 5.1 Typical Request Lifecycle

```
Client (Browser)
    │
    │  HTTP Request (e.g., POST /api/v1/shipments)
    ▼
Express App
    │
    ├─► Global Middleware (CORS, body parser, rate limiter)
    │
    ├─► Route Middleware (authenticate → authorize → validate)
    │
    ├─► Controller
    │       │
    │       ├─► Parses request (params, body, query)
    │       ├─► Calls service method
    │       └─► Formats and sends HTTP response
    │
    ├─► Service
    │       │
    │       ├─► Applies business rules
    │       ├─► Calls repository for data operations
    │       ├─► Optionally calls other modules' services
    │       └─► Returns result or throws domain error
    │
    ├─► Repository
    │       │
    │       ├─► Executes Prisma query
    │       └─► Returns data
    │
    └─► Error Handler (catches any thrown error, formats response)
```

### 5.2 Cross-Module Example: Accepting a Bid

```
ShipmentController.acceptBid(req, res)
    │
    ▼
BidService.accept(bidId, shipperId)
    ├─► BidRepository.findById(bidId)              — get the bid
    ├─► ShipmentService.getById(shipmentId)        — verify ownership and status
    ├─► BidRepository.updateStatus(bidId, ACCEPTED)
    ├─► BidRepository.declineOtherBids(shipmentId) — decline remaining bids
    ├─► ShipmentService.updateStatus(shipmentId, IN_PROGRESS)
    └─► NotificationService.send(transporterId, "Your bid was accepted")
```

---

## 6. Shared Infrastructure

### 6.1 Middleware Pipeline

Middleware executes in the following order for protected routes:

```
Request → CORS → Body Parser → Rate Limiter → Authenticate → Authorize(role) → Validate(schema) → Controller
```

| Middleware | Purpose |
|-----------|---------|
| `authenticate` | Verifies the session token via Better Auth; attaches `req.user` |
| `authorize(roles)` | Checks `req.user.role` against allowed roles; returns 403 if denied |
| `validate(schema)` | Validates `req.body`, `req.params`, or `req.query` against a Zod schema; returns 400 with details if invalid |
| `rateLimiter` | Limits request rate per IP; configurable per route group |
| `errorHandler` | Global catch-all; formats errors into consistent JSON responses |

### 6.2 Error Handling

All errors flow through a centralized error handler. Domain errors use a custom `AppError` class:

```javascript
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}
```

The global error handler maps errors to the standard response format:

```json
{
  "error": {
    "code": "SHIPMENT_NOT_FOUND",
    "message": "Shipment with the given ID does not exist.",
    "details": null
  }
}
```

### 6.3 Logging

Structured JSON logging using a lightweight logger (e.g., `pino`):

```json
{
  "level": "error",
  "timestamp": "2026-10-03T17:30:00.000Z",
  "module": "bid",
  "message": "Bid submission failed — shipment not in PUBLISHED status",
  "shipmentId": "abc-123",
  "userId": "usr-456"
}
```

---

## 7. Frontend Architecture

### 7.1 Pattern

The frontend follows a **feature-based** folder structure mirroring the backend modules. Each feature folder contains its own pages, components, hooks, and API calls.

### 7.2 State Management

| Concern | Tool | Usage |
|---------|------|-------|
| Server state | TanStack Query | API data fetching, caching, optimistic updates |
| Client state | React Context | Auth state (current user, session), UI preferences |
| Local component state | `useState` / `useReducer` | Form inputs, toggles, modal visibility |

### 7.3 API Communication

- A shared API client wraps `fetch` or `axios` with base URL, auth headers, and error interceptors.
- TanStack Query manages request lifecycle (loading, error, caching, refetching).
- API response errors are intercepted and displayed using consistent toast/notification patterns.

---

## 8. Key Architectural Decisions

| # | Decision | Options Considered | Chosen | Rationale |
|---|----------|--------------------|--------|-----------|
| 1 | Application architecture | Microservices, Monolith, Modular Monolith | Modular Monolith | Single team, simpler deployment, clear module boundaries, extractable later |
| 2 | Internal module structure | MVC, Layered, Hexagonal | Layered (4 layers) | Straightforward, well-understood, sufficient for CRUD-heavy domain |
| 3 | API style | REST, GraphQL | REST | Simpler tooling, Swagger documentation, fits the resource-oriented domain |
| 4 | Database | PostgreSQL, MongoDB | PostgreSQL | Relational data with strong consistency; Prisma provides good DX |
| 5 | Authentication | Passport.js, Better Auth, custom JWT | Better Auth | Built-in session management, social login support, less custom code |
| 6 | Validation | Joi, Yup, Zod | Zod | Schema-first, composable, good error messages |
| 7 | Frontend state | Redux, Zustand, Context + TanStack Query | Context + TanStack Query | No complex global state; TanStack Query handles 90% of state (server data) |
| 8 | Server-side caching | Redis from start, no caching, conditional | Conditional (Redis when justified) | Avoid premature optimization; database is sufficient at initial scale |
