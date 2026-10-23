# Product Overview

**Project:** FETAN Digital Freight Marketplace  

## Problem

Shippers who need road freight transport and transporters who can provide it may have difficulty finding suitable counterparties efficiently and coordinating a transport arrangement. The specific causes, frequency, current workarounds, and impact of this problem in Ethiopia still need validation through research with users.

## Target users

The platform has exactly three user roles:

- **Shipper:** A person or organization that needs goods transported by road.
- **Transporter:** A person who provides road freight transport using a vehicle, such as a truck, Isuzu, or FSR. A transporter cannot manage multiple vehicles in the current product scope.
- **Admin:** A platform administrator responsible for user moderation, shipment oversight, and platform metrics.

The two marketplace parties are Shippers and Transporters. There are no separate roles for truck owners, fleet managers, or transportation companies.

## Project vision

Make it easier for shippers and transporters to find each other and arrange road freight transportation anywhere in Ethiopia through a clear and usable digital marketplace.

The intended marketplace covers any shipment size and goods type. Applicable operational, safety, and regulatory constraints require validation.

## Business goals

Create a trusted digital marketplace that efficiently facilitate goods owners who need transportation and   transporters find each other, making freight transportation easier to find, arrange, and manage while creating sustainable value for the platform.

## Business model

The platform will operate as a two-sided digital marketplace connecting Shippers and Transporters. Potential revenue mechanisms include transaction commissions, service fees, subscriptions, and premium marketplace services. The final revenue model will be determined following market research and validation.

## Value the platform may provide

- **For shippers:** A way to publish road freight needs and make them discoverable to transporters, then review and discuss responses.
- **For transporters:** A way to discover freight opportunities across Ethiopia and respond to shippers.
- **For both parties:** A shared place to exchange relevant transport information and coordinate an arrangement.The main value the platform provid is efficiency.

## Tech stack

Frontend: React + Vite + JavaScript  
UI styling: Tailwind CSS  
State management: React Context (simple shared state)  
Server-state management and caching: TanStack Query  
Backend: Node.js + Express.js + JavaScript (ES modules)  
Database: PostgreSQL  
ORM: Prisma  
Authentication: Better Auth  
Server-side caching: Redis (only if server-side caching or shared coordination becomes necessary)  
API documentation: Swagger / OpenAPI  
Maps and locations: OpenStreetMap + Leaflet  
File storage: Cloudinary or S3-compatible storage  
Validation: Zod  
Testing: Vitest + Supertest + Playwright  
Version control: Git + GitHub  
Deployment: Vercel (frontend) + Render (backend) + managed PostgreSQL  
Containers: Docker + Docker Compose

