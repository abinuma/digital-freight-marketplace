# Deployment Architecture

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Pattern:** Modular Monolith — single backend deployable  

---

## 1. Overview

The Digital Freight Marketplace uses a static frontend hosted on **Vercel**, an API server hosted by a provider selected by the project owner, and **Neon PostgreSQL**. Local API development connects to a Neon development branch over TLS; no local database is used. All deployed tiers communicate over HTTPS. Docker is not part of the local development workflow.

---

## 2. Environment Strategy

| Environment | Purpose | URL Pattern | Deployment Trigger |
|-------------|---------|-------------|-------------------|
| **Local** | Development and debugging | `localhost:3000` (client), `localhost:5000` (server) | Manual (`npm run dev`) |
| **Preview** | Pull request review | Auto-generated Vercel preview URLs; Render preview instances | Push to feature branch |
| **Staging** | Pre-production validation | `staging.example.com` | Merge to `develop` branch |
| **Production** | Live user-facing system | `app.example.com` | Merge to `main` branch |

### Environment Variables

All configuration is driven by environment variables — no secrets in source code.

| Variable | Example | Where Set |
|----------|---------|-----------|
| `DATABASE_URL` | Neon PostgreSQL connection URI with TLS | API host / `server/.env` |
| `BETTER_AUTH_SECRET` | (random 64-char string) | API host / `.env` |
| `CORS_ORIGIN` | `https://app.example.com` | API host / `.env` |
| `CLOUDINARY_URL` | `cloudinary://key:secret@cloud` | API host / `.env` |
| `BREVO_API_KEY` | Brevo transactional email API key | API host / `server/.env` |
| `EMAIL_FROM` | `Digital Freight Marketplace <notifications@yourdomain.com>` | API host / `server/.env` |
| `NODE_ENV` | `production` | API host / `.env` |
| `PORT` | `5000` | API host / `.env` |
| `LOG_LEVEL` | `info` | API host / `.env` |
| `RATE_LIMIT_WINDOW_MS` | `60000` | API host / `.env` |
| `RATE_LIMIT_MAX` | `100` | API host / `.env` |

A `.env.example` file in the repository root documents every required variable without values.

---

## 3. Infrastructure Topology

```
                    ┌──────────────────────────────┐
                    │         Cloudflare DNS        │
                    │     (optional CDN / proxy)    │
                    └──────┬──────────────┬────────┘
                           │              │
              ┌────────────▼───┐    ┌─────▼────────────┐
              │    Vercel      │    │   API Hosting    │
              │  (Frontend)    │    │   (API Server)    │
              │ React + Vite   │    │ Node.js + Express │
              │ Static SPA     │    │ Modular Monolith  │
              └────────────────┘    └──┬───────────┬───┘
                                       │           │
                              ┌────────▼──┐  ┌─────▼──────────┐
                              │    Neon    │  │   Cloudinary   │
                              │ PostgreSQL │  │   / S3         │
                              └───────────┘  └────────────────┘
```

---

## 4. Frontend Deployment (Vercel)

| Aspect | Detail |
|--------|--------|
| Platform | Vercel |
| Build command | `npm run build` (Vite) |
| Output directory | `dist/` |
| Node version | Use a currently supported Node.js release |
| Framework preset | Vite |
| Root directory | `client/` |

### Vercel Configuration

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

The SPA rewrite ensures client-side routing works — all paths serve `index.html`, and React Router handles navigation.

### Environment Variables (Vercel)

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://api.example.com/api/v1` |

---

## 5. Backend Deployment (Provider to be selected)

| Aspect | Detail |
|--------|--------|
| Platform | To be selected by project owner |
| Runtime | Node.js release supported by the selected API host |
| Build command | `npm ci && npx prisma generate` |
| Start command | `node src/server.js` |
| Root directory | `server/` |
| Instance type | Starter (scaled as needed) |
| Health check path | `/api/v1/health` |
| Auto-deploy | Configure with selected provider |

### Example Hosting Configuration

```yaml
# Adapt this example after selecting an API hosting provider.
services:
  - type: web
    name: dfm-api
    runtime: node
    plan: starter
    buildCommand: npm ci && npx prisma generate
    startCommand: node src/server.js
    rootDir: server
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: dfm-db
          property: connectionString
      - key: BETTER_AUTH_SECRET
        generateValue: true
      - key: CORS_ORIGIN
        value: https://app.example.com
    healthCheckPath: /api/v1/health
    autoDeploy: true

databases:
  - name: dfm-db
    plan: starter
    databaseName: dfm
    postgresMajorVersion: 16
```

### Health Check Endpoint

A lightweight health endpoint confirms the API is operational:

```javascript
// GET /api/v1/health
{
  "status": "healthy",
  "timestamp": "2026-10-03T17:30:00.000Z",
  "version": "1.0.0",
  "uptime": 86400
}
```

---

## 6. Database Deployment (Neon PostgreSQL)

| Aspect | Detail |
|--------|--------|
| Provider | Neon |
| Version | PostgreSQL version selected for the Neon project |
| Branches | Separate development and production branches/databases |
| Connection | Neon connection URI with TLS; use pooled URI where appropriate |
| Connection pooling | Follow Neon and Prisma guidance for pooled/runtime and direct migration connections |
| Backups | Configure and verify according to the selected Neon plan |
| Maintenance window | Managed by Neon |

### Migration Deployment

Migrations run **before** the application starts in production:

```bash
# Production migration (non-interactive)
npx prisma migrate deploy
```

Run against the explicitly selected Neon branch as part of deployment or a pre-start step:

```json
{
  "scripts": {
    "start": "node src/server.js",
    "prestart": "npx prisma migrate deploy",
    "dev": "nodemon src/server.js"
  }
}
```

### Connection Management

| Setting | Value | Rationale |
|---------|-------|-----------|
| Pool size | 10 (default) | Sufficient for single-instance starter plan |
| Connection timeout | 5 seconds | Fail fast on connectivity issues |
| Idle timeout | 10 seconds | Free unused connections |

Prisma client configuration in `shared/db/prisma.js`:

```javascript
import 'dotenv/config';
import { PrismaClient } from '../../../generated/prisma/index.js';
import { PrismaNeon } from '@prisma/adapter-neon';

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
export default prisma;
```

---

## 7. Containerization (Optional future deployment)

Docker is not used for local database development because local API work connects directly to Neon. Containerization may be added later if required by the selected API host. CI should use a dedicated test database or an isolated ephemeral PostgreSQL service, never development or production data.

### Dockerfile (Backend)

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

# ---- Run stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
```

### Docker Compose

No Docker Compose database service is used in the current workflow.

```yaml
version: '3.8'

services:
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - '5000:5000'
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://dfm:dfm_password@db:5432/dfm_dev
      - BETTER_AUTH_SECRET=dev-secret-change-me
      - CORS_ORIGIN=http://localhost:3000
      - PORT=5000
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./server/src:/app/src  # Hot-reload in development

  db:
    image: postgres:16-alpine
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: dfm
      POSTGRES_PASSWORD: dfm_password
      POSTGRES_DB: dfm_dev
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U dfm -d dfm_dev']
      interval: 5s
      timeout: 3s
      retries: 5

volumes:
  pgdata:
```

---

## 8. CI/CD Pipeline

The CI/CD pipeline runs on **GitHub Actions** and automates quality checks and deployment.

### Pipeline Stages

```
Push / PR                    Merge to main
    │                             │
    ▼                             ▼
┌──────────┐              ┌────────────┐
│  Lint    │              │   Deploy   │
│  Test    │              │  (Auto)    │
│  Build   │              └──────┬─────┘
│  Audit   │                     │
└──────────┘              ┌──────▼─────┐
                          │  Migrate   │
                          │  DB        │
                          └──────┬─────┘
                                 │
                          ┌──────▼─────┐
                          │  Health    │
                          │  Check     │
                          └────────────┘
```

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    # Configure DB-backed tests with an isolated Neon test branch or disposable PostgreSQL service.

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      # ---- Server ----
      - name: Install server dependencies
        working-directory: server
        run: npm ci

      - name: Generate Prisma client
        working-directory: server
        run: npx prisma generate

      - name: Run database migrations
        working-directory: server
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dfm_test

      - name: Lint server
        working-directory: server
        run: npm run lint

      - name: Test server
        working-directory: server
        run: npm test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/dfm_test
          NODE_ENV: test
          BETTER_AUTH_SECRET: test-secret

      # ---- Client ----
      - name: Install client dependencies
        working-directory: client
        run: npm ci

      - name: Lint client
        working-directory: client
        run: npm run lint

      - name: Build client
        working-directory: client
        run: npm run build
        env:
          VITE_API_BASE_URL: http://localhost:5000/api/v1

      - name: Security audit
        run: npm audit --audit-level=high
        working-directory: server
```

---

## 9. Monitoring and Observability

### Application-Level Monitoring

| Concern | Approach |
|---------|----------|
| Structured logging | JSON logs via `pino`; level controlled by `LOG_LEVEL` env var |
| Request logging | Log request method, path, status, and duration for every request |
| Error tracking | Unhandled rejections and uncaught exceptions logged with full context |
| Health endpoint | `GET /api/v1/health` returns status, uptime, and version |

### Infrastructure Monitoring

| Concern | Tool |
|---------|------|
| Server uptime | Monitoring and alerting from the selected API host |
| Database metrics | Neon project monitoring (connections, query time, storage) |
| Frontend performance | Vercel Analytics (Web Vitals, load time) |
| External uptime | UptimeRobot or similar (ping health endpoint every 5 min) |

### Log Format (Production)

```json
{
  "level": "info",
  "timestamp": "2026-10-03T17:30:00.000Z",
  "requestId": "req-abc-123",
  "method": "POST",
  "path": "/api/v1/shipments",
  "statusCode": 201,
  "duration": 42,
  "userId": "usr-456"
}
```

### Alerting

| Alert | Condition | Channel |
|-------|-----------|---------|
| API down | Health check fails 3 consecutive times | Email / Slack webhook |
| High error rate | > 5% of requests return 5xx in 5-minute window | Email |
| Database connection failure | Prisma connection error logged | Email |
| Disk / storage threshold | Database storage > 80% capacity | Render alert |

---

## 10. Scaling Strategy

The system starts with a single instance per tier. Scaling decisions are driven by measured metrics, not predictions.

### Horizontal Scaling Path

```
Phase 1 (Launch)           Phase 2 (Growth)              Phase 3 (Scale)
─────────────────         ─────────────────────         ─────────────────────
1× Render instance        2-3× Render instances         Auto-scaled instances
1× PostgreSQL             1× PostgreSQL + read replica  Dedicated PostgreSQL
No caching                Redis for sessions/cache      Redis cluster
Single region             Single region                 Multi-region (if needed)
```

### Scaling Triggers

| Metric | Threshold | Action |
|--------|-----------|--------|
| API response time (p95) | > 500ms sustained | Scale up Render plan or add instance |
| CPU usage | > 70% sustained | Scale up or out |
| Database connections | > 80% of pool | Increase pool size or add read replica |
| Database query time (p95) | > 100ms | Analyze and optimize queries; add indexes |
| Memory usage | > 80% | Profile for leaks; scale up |

### Statelessness

The API server is **stateless** — sessions live in the database, file storage is external, and there is no local file storage or in-memory cache at launch. This means any instance can handle any request, enabling straightforward horizontal scaling.

---

## 11. Disaster Recovery

| Aspect | Strategy |
|--------|----------|
| Database backups | Daily automated; 7-day retention (Render managed) |
| Point-in-time recovery | Verify availability and retention for the selected Neon plan |
| Code recovery | Git — all code in GitHub; tags per release |
| Secrets recovery | Document secrets in a secure vault; regenerate if compromised |
| Rollback procedure | Revert to previous Git commit; Render re-deploys automatically |
| RTO (Recovery Time Objective) | < 1 hour (redeploy from Git + restore DB backup) |
| RPO (Recovery Point Objective) | < 24 hours (daily backup frequency) |

### Rollback Procedure

1. **Code rollback:** Revert the `main` branch to the last working commit. Render auto-deploys on push.
2. **Database rollback:** Create a new forward migration to undo schema changes (Prisma does not support auto-rollback).
3. **Data rollback:** Restore from the most recent daily backup via the Render dashboard.

---

## 12. Production Readiness Checklist

| # | Item | Status |
|---|------|--------|
| 1 | All environment variables set in production | ☐ |
| 2 | `NODE_ENV=production` on the selected API host | ☐ |
| 3 | CORS origin restricted to frontend domain | ☐ |
| 4 | HTTPS enforced (Render + Vercel default) | ☐ |
| 5 | Database migrations applied (`prisma migrate deploy`) | ☐ |
| 6 | Seed data excluded in production | ☐ |
| 7 | Rate limiting configured and tested | ☐ |
| 8 | Health check endpoint responding | ☐ |
| 9 | Structured logging active (no `console.log`) | ☐ |
| 10 | Error handler returns generic messages in production | ☐ |
| 11 | `npm audit` passes with no high/critical vulnerabilities | ☐ |
| 12 | Helmet security headers enabled | ☐ |
| 13 | Database backups verified | ☐ |
| 14 | Uptime monitoring configured | ☐ |
| 15 | `.env` file is in `.gitignore` | ☐ |
