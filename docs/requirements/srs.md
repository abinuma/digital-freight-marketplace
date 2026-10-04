# Software Requirements Specification

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Status:** Draft  

---

## 1. Introduction

### 1.1 Purpose

This document defines the software requirements for the Digital Freight Marketplace — a web platform that connects shippers who need road freight transport with transporters who can provide it across Ethiopia. It serves as the authoritative reference for what the system must do and the quality attributes it must satisfy.

**Audience:** Developers, testers, project stakeholders, and future contributors.

### 1.2 Scope

The system is a two-sided digital marketplace with three user roles: **Shipper**, **Transporter**, and **Admin**. The initial release focuses on freight discovery and coordination — enabling Shippers to publish transport needs and Transporters to discover and respond to them.

**In scope:**

- User registration and authentication for Shippers and Transporters.
- Shipment listing creation, discovery, and search.
- Transporter bid/response workflow.
- Communication between matched parties.
- Basic admin oversight and user management.
- Map-based route and location visualization.

**Out of scope for initial release:**

- In-app payment processing.
- Fleet management (multi-vehicle transporter accounts).
- Shipment tracking (GPS/real-time).
- Automated price calculation or matching algorithms.
- Mobile native applications (web-responsive only).
- Regulatory compliance verification (licenses, permits).

### 1.3 Definitions & Acronyms

| Term | Definition |
|------|-----------|
| SRS | Software Requirements Specification |
| Shipper | A person or organization that needs goods transported by road |
| Transporter | A person who provides road freight transport using a single vehicle |
| Shipment | A freight transport request published by a Shipper |
| Bid | A Transporter's response to a Shipment listing with proposed terms |
| Listing | A published shipment request visible to Transporters |
| Route | The path from pickup location to delivery location |
| Goods Type | Category of items being transported (e.g., agricultural, industrial, household) |
| Dashboard | A personalized landing page showing relevant data for a user role |
| RBAC | Role-Based Access Control |
| API | Application Programming Interface |

### 1.4 References

| Document | Location |
|----------|----------|
| Product Overview | [`docs/product-overview.md`](../product-overview.md) |
| Functional Requirements | [`docs/requirements/functional-requirements.md`](./functional-requirements.md) |
| Non-Functional Requirements | [`docs/requirements/non-functional-requirements.md`](./non-functional-requirements.md) |
| User Stories | [`docs/requirements/user-stories.md`](./user-stories.md) |
| Use Cases | [`docs/requirements/use-cases.md`](./use-cases.md) |

---

## 2. Overall Description

### 2.1 Product Perspective

The Digital Freight Marketplace is a new, standalone web application. It is not a replacement for or extension of an existing system. It operates as a self-contained platform with its own data store, authentication, and user interface.

The system consists of:

- A **client-side web application** (React + Vite) that provides the user interface.
- A **server-side API** (Node.js + Express.js) that handles business logic and data access.
- A **relational database** (PostgreSQL via Prisma ORM) for persistent storage.
- **Third-party integrations** for maps, file storage, and authentication.

### 2.2 Product Functions

| Function Area | Description |
|---------------|-------------|
| User Management | Registration, login, profile management, role assignment |
| Shipment Management | Create, edit, publish, close, and delete shipment listings |
| Discovery & Search | Browse and filter available shipments by location, goods type, date, and route |
| Bidding & Response | Transporters submit bids; Shippers review, accept, or decline |
| Communication | In-platform messaging between Shipper and Transporter on a shipment |
| Map Visualization | Display pickup/delivery locations and routes on a map |
| Admin Dashboard | User oversight, shipment moderation, platform metrics |
| Notifications | Email and in-app alerts for key platform events |

### 2.3 User Characteristics

| User Role | Technical Proficiency | Usage Pattern |
|-----------|----------------------|---------------|
| Shipper | Low to moderate; may use smartphones primarily | Creates shipments when transport is needed; frequency varies |
| Transporter | Low to moderate; may use smartphones primarily | Browses regularly for freight opportunities |
| Admin | Moderate to high | Ongoing platform management and support |

### 2.4 Operating Environment

- Modern web browsers (Chrome, Firefox, Safari, Edge — latest two major versions).
- Responsive design supporting desktop, tablet, and mobile screen sizes.
- Internet connectivity required; no offline mode.

---

## 3. Technology Stack

| Category | Technology |
|----------|-----------|
| Frontend | React + Vite + JavaScript |
| UI Styling | Tailwind CSS |
| State Management | React Context |
| Server-State & Caching | TanStack Query |
| Backend | Node.js + Express.js + JavaScript (ES modules) |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | Better Auth |
| Server-Side Caching | Redis (only if justified by measured need) |
| API Documentation | Swagger / OpenAPI |
| Maps & Locations | OpenStreetMap + Leaflet |
| File Storage | Cloudinary or S3-compatible storage |
| Validation | Zod |
| Testing | Vitest + Supertest + Playwright |
| Version Control | Git + GitHub |
| Deployment | Vercel (frontend) + Render (backend) + managed PostgreSQL |
| Containers | Docker + Docker Compose |

---

## 4. External Interface Requirements

### 4.1 User Interfaces

| Interface | Description |
|-----------|-------------|
| Registration / Login | Forms for user sign-up (role selection) and sign-in |
| Shipper Dashboard | Overview of own shipments, received bids, and messages |
| Transporter Dashboard | Overview of available shipments, submitted bids, and messages |
| Shipment Create/Edit Form | Multi-field form with location picker (map), date picker, and image upload |
| Shipment Listing Page | Filterable, paginated list with map view |
| Shipment Detail Page | Full shipment info, bid list (for Shipper), bid form (for Transporter) |
| User Profile Page | Profile details, vehicle info (Transporter), ratings |
| Admin Dashboard | User management, shipment moderation, metrics overview |

### 4.2 Software Interfaces

| Interface | Technology | Purpose |
|-----------|-----------|---------|
| Maps & Geocoding | OpenStreetMap + Leaflet | Location input/display, route visualization |
| File Storage | Cloudinary or S3-compatible | Goods images, profile photos |
| Email Service | SMTP / transactional email provider | Notifications (registration, bid events, password reset) |
| Authentication | Better Auth | User identity, session management |

### 4.3 API Interface

| Aspect | Specification |
|--------|---------------|
| Protocol | RESTful HTTP/HTTPS |
| Data Format | JSON |
| Documentation | OpenAPI 3.x (served via Swagger UI) |
| Versioning | URL-based (e.g., `/api/v1/`) |
| Authentication | Bearer token (session-based via Better Auth) |
| Error Format | Consistent JSON: `{ "error": { "code", "message", "details" } }` |

---

## 5. Constraints & Assumptions

### 5.1 Constraints

| ID | Constraint |
|----|-----------|
| C-001 | The initial release targets the Ethiopian road freight market only. |
| C-002 | A Transporter account is limited to one vehicle in the current scope. |
| C-003 | The platform does not handle payments; financial transactions occur off-platform. |
| C-004 | The platform does not verify transporter licenses, permits, or insurance. |
| C-005 | The system requires internet connectivity; no offline capability. |
| C-006 | Technology stack is fixed as specified in the Product Overview. |

### 5.2 Assumptions

| ID | Assumption |
|----|-----------|
| A-001 | Users have access to a modern web browser and internet connection. |
| A-002 | Users can provide valid email addresses for registration. |
| A-003 | Shippers can reasonably estimate goods weight and describe goods type. |
| A-004 | Ethiopian locations can be adequately represented using OpenStreetMap data. |
| A-005 | The initial user base will not exceed 1,000 registered users. |
| A-006 | A single-server deployment is sufficient for the initial launch. |

### 5.3 Dependencies

| ID | Dependency |
|----|-----------|
| D-001 | OpenStreetMap tile servers for map rendering. |
| D-002 | Cloudinary/S3 service availability for file storage. |
| D-003 | SMTP/email provider for transactional emails. |
| D-004 | Vercel and Render platform availability for hosting. |
| D-005 | Managed PostgreSQL service availability. |

---

## 6. Detailed Requirements

Detailed requirements are maintained in separate documents for clarity:

- **Functional Requirements:** [functional-requirements.md](./functional-requirements.md)
- **Non-Functional Requirements:** [non-functional-requirements.md](./non-functional-requirements.md)
- **User Stories:** [user-stories.md](./user-stories.md)
- **Use Cases:** [use-cases.md](./use-cases.md)

---

> **Document Control**  
> This is a living document. Changes are tracked via version control (Git).  
> Major revisions require review and approval from the project lead.
