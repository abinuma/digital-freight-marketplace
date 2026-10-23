# Non-Functional Requirements

**Project:** FETAN Digital Freight Marketplace

## Performance
- The system shall support at least 100 concurrent users without performance degradation. | Response times remain within stated thresholds
- Database queries for search and listing operations shall use appropriate indexes. | No full table scans on primary query paths
- Paginated endpoints shall maintain consistent response times regardless of total dataset size.
## Security
- All client-server communication shall use HTTPS (TLS 1.2+). | No HTTP endpoints exposed in production
- User passwords shall be hashed using Better Auth's built-in scrypt implementation. | No plaintext or reversible password storage; hashes are verified through Better Auth
- All API endpoints (except public auth routes) shall enforce authentication. | 401 returned for unauthenticated requests
- API endpoints shall enforce authorization based on user role (RBAC). | 403 returned for unauthorized role access
- User input shall be validated and sanitized on both client and server to prevent XSS and injection attacks. | Zod validation on all API inputs
- Session tokens shall expire after a configurable period of inactivity (default: 7 day). | Expired sessions return 401
- Authentication endpoints shall be rate-limited to prevent brute-force attacks. | Max 10 failed login attempts per IP per 15 minutes
- File uploads shall be validated for MIME type and size before storage. | Max 5 MB per file; images only (JPEG, PNG, WebP)
- CORS shall be configured to allow only the frontend origin in production. | No wildcard `*` origin in production
- Sensitive configuration (database URLs, API keys, secrets) shall never be committed to version control. | All secrets via environment variables; `.env` in `.gitignore`
## Usability
- The interface shall be responsive and functional on screen widths from 320px to 1920px. | All core workflows completable at 320px, 768px, and 1920px
- Core workflows (register, post shipment, browse, submit bid) shall be completable in 5 steps or fewer. 
- Form validation errors shall display inline next to the relevant field with a clear description of the issue. | No generic "form invalid" messages
- The interface shall use consistent visual hierarchy, spacing, and component patterns across all pages. | Design system applied uniformly
- Interactive elements (buttons, links, inputs) shall have visible focus and hover states.
- Loading states shall be indicated with appropriate visual feedback (spinners). | No blank screens during data fetch
## Reliability & Availability
- The system shall target 99% uptime during operational hours. 
- The system shall handle unexpected errors gracefully with user-friendly error pages (not stack traces).No raw error output visible to users
- Failed API requests shall return consistent error responses with appropriate HTTP status codes.
## Maintainability
- The codebase shall follow a layered architecture separating routes, controllers, services, and data access.
- Environment-specific configuration shall be externalized via environment variables.
- Database schema changes shall be managed via versioned migrations (Prisma Migrate).
## Scalability 
- The architecture shall support horizontal scaling of the API layer (stateless server design).
- Server-side caching (Redis) shall be introduced only when measured performance data justifies it.
## Deployment & DevOps
- The application shall be containerized using Docker with a `docker-compose.yml` for local development. | `docker-compose up` starts full stack locally
- The project shall include a CI pipeline that runs linting, type checking, and tests on every pull request. | CI status check required for merge
- Frontend shall be deployable to Vercel; backend shall be deployable to Render.
