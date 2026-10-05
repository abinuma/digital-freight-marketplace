# Non-Functional Requirements

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Parent Document:** [srs.md](./srs.md)  

---

## Conventions

- Requirements are identified as **NFR-XXX**.
- Each requirement specifies a measurable acceptance criterion where applicable.

---

## 1. Performance

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-001 | Standard API responses (CRUD operations) shall complete within 500ms under normal load. | ≤ 500ms at p95 with ≤ 100 concurrent users |
| NFR-002 | Search and listing pages shall render within 2 seconds on a standard broadband connection (10 Mbps). | ≤ 2s Time to Interactive |
| NFR-003 | The system shall support at least 100 concurrent users without performance degradation. | Response times remain within stated thresholds |
| NFR-004 | Database queries for search and listing operations shall use appropriate indexes. | No full table scans on primary query paths |
| NFR-005 | Paginated endpoints shall maintain consistent response times regardless of total dataset size. | ≤ 500ms for any page |

---

## 2. Security

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-100 | All client-server communication shall use HTTPS (TLS 1.2+). | No HTTP endpoints exposed in production |
| NFR-101 | User passwords shall be hashed using Better Auth's built-in scrypt implementation. | No plaintext or reversible password storage; hashes are verified through Better Auth |
| NFR-102 | All API endpoints (except public auth routes) shall enforce authentication. | 401 returned for unauthenticated requests |
| NFR-103 | API endpoints shall enforce authorization based on user role (RBAC). | 403 returned for unauthorized role access |
| NFR-104 | User input shall be validated and sanitized on both client and server to prevent XSS and injection attacks. | Zod validation on all API inputs |
| NFR-105 | Session tokens shall expire after a configurable period of inactivity (default: 24 hours). | Expired sessions return 401 |
| NFR-106 | Authentication endpoints shall be rate-limited to prevent brute-force attacks. | Max 10 failed login attempts per IP per 15 minutes |
| NFR-107 | File uploads shall be validated for MIME type and size before storage. | Max 5 MB per file; images only (JPEG, PNG, WebP) |
| NFR-108 | CORS shall be configured to allow only the frontend origin in production. | No wildcard `*` origin in production |
| NFR-109 | Sensitive configuration (database URLs, API keys, secrets) shall never be committed to version control. | All secrets via environment variables; `.env` in `.gitignore` |

---

## 3. Usability

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-200 | The interface shall be responsive and functional on screen widths from 320px to 1920px. | All core workflows completable at 320px, 768px, and 1920px |
| NFR-201 | Core workflows (register, post shipment, browse, submit bid) shall be completable in 5 steps or fewer. | Step count verified per workflow |
| NFR-202 | Form validation errors shall display inline next to the relevant field with a clear description of the issue. | No generic "form invalid" messages |
| NFR-203 | The interface shall use consistent visual hierarchy, spacing, and component patterns across all pages. | Design system applied uniformly |
| NFR-204 | Interactive elements (buttons, links, inputs) shall have visible focus and hover states. | Keyboard-navigable; visible focus ring |
| NFR-205 | Loading states shall be indicated with appropriate visual feedback (spinners, skeletons). | No blank screens during data fetch |

---

## 4. Reliability & Availability

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-300 | The system shall target 99% uptime during operational hours. | Measured monthly via hosting provider |
| NFR-301 | The system shall handle unexpected errors gracefully with user-friendly error pages (not stack traces). | No raw error output visible to users |
| NFR-302 | Database backups shall be performed daily with at least 7 days of retention. | Verified via hosting provider backup policy |
| NFR-303 | The application shall log errors with structured format (JSON) including timestamp, level, message, and stack trace. | Logs queryable by level and timestamp |
| NFR-304 | Failed API requests shall return consistent error responses with appropriate HTTP status codes. | All errors follow `{ "error": { "code", "message" } }` format |

---

## 5. Maintainability

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-400 | The codebase shall follow a layered architecture separating routes, controllers, services, and data access. | Code review checklist item |
| NFR-401 | All API endpoints shall be documented in OpenAPI 3.x specification and served via Swagger UI. | Swagger UI accessible at `/api/docs` |
| NFR-402 | Environment-specific configuration shall be externalized via environment variables with a documented `.env.example` file. | `.env.example` present and up to date |
| NFR-403 | The project shall include automated tests covering critical business logic (shipment lifecycle, bidding, authentication). | Tests exist and pass in CI |
| NFR-404 | Code shall follow a consistent style enforced by ESLint and Prettier. | No lint errors on CI |
| NFR-405 | Database schema changes shall be managed via versioned migrations (Prisma Migrate). | No manual schema changes in production |

---

## 6. Scalability

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-500 | The architecture shall support horizontal scaling of the API layer (stateless server design). | No server-local session storage; sessions in DB or external store |
| NFR-501 | Server-side caching (Redis) shall be introduced only when measured performance data justifies it. | Performance profiling precedes cache implementation |
| NFR-502 | The database schema shall be designed to support growth to 10,000 users and 50,000 shipment records without restructuring. | Schema reviewed for index coverage at projected scale |

---

## 7. Deployment & DevOps

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-600 | The application shall be containerized using Docker with a `docker-compose.yml` for local development. | `docker-compose up` starts full stack locally |
| NFR-601 | The project shall include a CI pipeline that runs linting, type checking, and tests on every pull request. | CI status check required for merge |
| NFR-602 | Frontend shall be deployable to Vercel; backend shall be deployable to Render. | Deployment documented and reproducible |
| NFR-603 | Environment parity: local development, staging, and production environments shall use the same database engine and runtime versions. | Documented in `.env.example` and Docker config |

---

## Requirement Summary

| Category | ID Range | Count |
|----------|----------|-------|
| Performance | NFR-001 – NFR-005 | 5 |
| Security | NFR-100 – NFR-109 | 10 |
| Usability | NFR-200 – NFR-205 | 6 |
| Reliability & Availability | NFR-300 – NFR-304 | 5 |
| Maintainability | NFR-400 – NFR-405 | 6 |
| Scalability | NFR-500 – NFR-502 | 3 |
| Deployment & DevOps | NFR-600 – NFR-603 | 4 |
| **Total** | | **39** |
