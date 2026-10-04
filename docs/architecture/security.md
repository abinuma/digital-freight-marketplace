# Security Architecture

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  

---

## 1. Overview

Security is applied at every layer — transport, authentication, authorization, input validation, and data storage.

---

## 2. Authentication

Handled by **Better Auth** with session-based management.

| Aspect | Detail |
|--------|--------|
| Strategy | Session-based (cookies) |
| Session storage | PostgreSQL (managed by Better Auth) |
| Token delivery | HTTP-only, Secure, SameSite=Lax cookie |
| Session lifetime | 24 hours of inactivity (configurable) |
| Password hashing | bcrypt, work factor ≥ 10 |
| Password reset | Time-limited email token (1 hour expiry) |
| Password rules | Min 8 chars, one uppercase, one lowercase, one digit |

### Authentication Flow

```
Client                         Server                         Database
  │  POST /auth/login            │                               │
  │  { email, password }         │                               │
  │─────────────────────────────►│  Find user, compare hash      │
  │                              │──────────────────────────────►│
  │                              │  Create session record         │
  │  Set-Cookie: session_token   │──────────────────────────────►│
  │  (HttpOnly, Secure)          │                               │
  │◄─────────────────────────────│                               │
```

---

## 3. Authorization (RBAC)

Three roles, enforced via `authorize(roles)` middleware:

| Role | Access Scope |
|------|-------------|
| `SHIPPER` | Own shipments, bids on own shipments, messaging, reviews |
| `TRANSPORTER` | Browse shipments, own bids, messaging, reviews |
| `ADMIN` | User moderation, shipment moderation, platform metrics |

### Resource Ownership

Beyond role checks, the **service layer** verifies ownership:

| Operation | Check |
|-----------|-------|
| Edit/cancel shipment | `shipment.shipperId === req.user.id` |
| Update/withdraw bid | `bid.transporterId === req.user.id` |
| Accept/decline bid | `shipment.shipperId === req.user.id` |

---

## 4. Input Validation

| Level | Tool | Purpose |
|-------|------|---------|
| Client | React form validation | User feedback (not trusted) |
| Server | Zod via `validate` middleware | Authoritative — rejects bad input before business logic |

Validated: `req.body`, `req.params` (UUID format), `req.query` (pagination/filters).

---

## 5. Threat Mitigations

| Threat | Mitigation |
|--------|-----------|
| SQL injection | Prisma parameterized queries; no raw SQL |
| XSS | React auto-escaping; CSP headers; no `dangerouslySetInnerHTML` |
| CSRF | SameSite cookies; CORS origin restriction |
| Brute-force login | Rate limiting: 10 attempts / 15 min per IP |
| Session hijacking | HttpOnly + Secure + SameSite cookies; HTTPS only |
| Privilege escalation | RBAC middleware + ownership checks in service layer |
| Malicious uploads | MIME type + size validation; external storage only |
| Info disclosure | Production: generic errors only; stack traces logged server-side |
| Dependency vulns | Regular `npm audit`; automated alerts |

---

## 6. Transport Security

| Measure | Detail |
|---------|--------|
| HTTPS | TLS 1.2+ enforced in production (Vercel/Render) |
| CORS | Frontend origin only; `credentials: true`; no wildcard |
| Cookie flags | `HttpOnly`, `Secure`, `SameSite=Lax` |

---

## 7. Security Headers (via Helmet)

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Content-Security-Policy` | Configured per environment |

---

## 8. Rate Limiting

| Route Group | Limit | Window | Key |
|-------------|-------|--------|-----|
| `/auth/login`, `/auth/register` | 10 req | 15 min | IP |
| `/auth/forgot-password` | 3 req | 15 min | IP |
| General authenticated API | 100 req | 1 min | User ID |
| File uploads | 20 req | 1 min | User ID |

---

## 9. File Upload Security

| Rule | Value |
|------|-------|
| Allowed types | JPEG, PNG, WebP |
| Max size | 5 MB per file |
| Max per shipment | 5 images |
| Storage | Cloudinary / S3 (never on app server) |
| Validation | MIME type checked server-side before upload |

---

## 10. Data Protection

| Concern | Approach |
|---------|---------|
| Passwords | bcrypt hashed; never stored plain; never logged |
| Sessions | DB-stored; HTTP-only cookie transport |
| Secrets | Environment variables; `.env` in `.gitignore` |
| Logging | Sensitive fields (password, token) excluded |
| DB access | Dedicated user with minimal privileges |
| Backups | Daily automated; 7-day retention via managed provider |

---

## 11. Error Handling

| Environment | Response |
|-------------|---------|
| Development | Full error details + stack trace |
| Production | Generic message only; internals logged server-side |

---

## 12. Dependency Management

| Practice | Detail |
|----------|--------|
| Lock file | `package-lock.json` committed; installs use `npm ci` |
| Audit | `npm audit` run in CI; high/critical vulnerabilities block merge |
| Updates | Dependabot or Renovate configured for automated PR creation |
| Review | Dependency updates reviewed by a maintainer before merge |
| Minimal dependencies | Prefer well-maintained packages with small dependency trees |

---

## 13. Security Review Checklist

A periodic checklist for security reviews before each release:

| # | Item | Check |
|---|------|-------|
| 1 | All endpoints require authentication unless explicitly public | ☐ |
| 2 | RBAC middleware applied to every route group | ☐ |
| 3 | Ownership checks in service layer for resource mutations | ☐ |
| 4 | Zod validation schemas cover all request inputs | ☐ |
| 5 | No raw SQL — all queries via Prisma parameterized client | ☐ |
| 6 | Passwords never logged or included in API responses | ☐ |
| 7 | Rate limiting active on auth and upload routes | ☐ |
| 8 | CORS restricted to known frontend origin(s) | ☐ |
| 9 | Helmet security headers enabled | ☐ |
| 10 | Cookie flags: `HttpOnly`, `Secure`, `SameSite=Lax` | ☐ |
| 11 | `npm audit` passes with no high/critical findings | ☐ |
| 12 | `.env` file is in `.gitignore` | ☐ |
| 13 | Error responses in production do not leak internals | ☐ |
| 14 | File upload MIME type and size validation active | ☐ |
