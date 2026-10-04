# Architecture Documentation

**Project:** Digital Freight Marketplace  
**Last Updated:** 2026-10-03  

---

## Overview

This directory contains the architecture documentation for the Digital Freight Marketplace. The system follows a **Modular Monolith** pattern with **Layered Architecture** within each module.

All documents reflect the scope defined in the [Product Overview](../product-overview.md) and the requirements in [requirements/](../requirements/).

## Documents

| Document | Description |
|----------|-------------|
| [architecture.md](./architecture.md) | System architecture — modular monolith structure, module boundaries, layer definitions, and data flow |
| [database.md](./database.md) | Database design — schema overview, entity relationships, indexing strategy, and migration approach |
| [api.md](./api.md) | API architecture — endpoint catalog, request/response conventions, versioning, and error handling |
| [security.md](./security.md) | Security architecture — authentication, authorization, input validation, and threat mitigations |
| [deployment.md](./deployment.md) | Deployment architecture — environments, containerization, CI/CD, and infrastructure |

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                        │
│                    React + Vite + Tailwind CSS                  │
│                  TanStack Query + React Context                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST
┌───────────────────────────▼─────────────────────────────────────┐
│                     API Server (Express.js)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────┐ ┌─────────────┐ │
│  │   Auth   │ │ Shipment │ │ Bid  │ │  Msg  │ │    Admin    │ │
│  │  Module  │ │  Module  │ │Module│ │Module │ │   Module    │ │
│  └──────────┘ └──────────┘ └──────┘ └───────┘ └─────────────┘ │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │               Shared (middleware, utils, config)            ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │ Prisma Client
┌───────────────────────────▼─────────────────────────────────────┐
│                       PostgreSQL Database                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Modular Monolith** over Microservices | Single team, single deployable unit, simpler operations — modules can be extracted later if needed |
| **Layered Architecture** within modules | Clear separation of concerns; each layer has one job |
| **PostgreSQL** as the sole data store | Relational data model fits the domain; Prisma provides type-safe access |
| **No Redis at launch** | Added only when measured performance data justifies server-side caching |
| **REST API** over GraphQL | Simpler to implement, document, and debug for a CRUD-heavy marketplace |
