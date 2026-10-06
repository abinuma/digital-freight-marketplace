# Database Architecture

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Database:** PostgreSQL  
**ORM:** Prisma  

---

## 1. Overview

The application uses PostgreSQL as its sole persistent data store, accessed through Prisma ORM. The database schema is designed around the platform's core business domains, with each domain module owning its tables. Schema changes are managed exclusively through Prisma Migrate (versioned migrations).

---

## 2. Entity Relationship Diagram

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│     User     │       │     Shipment     │       │     Bid      │
├──────────────┤       ├──────────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)      │
│ email        │◄──┐   │ shipperId (FK)   │──►┐   │ shipmentId   │──►┐
│ name         │   │   │ goodsDescription │   │   │ transporterId│──►│
│ phone        │   │   │ goodsType        │   │   │ price        │   │
│ role         │   │   │ weightKg         │   │   │ pickupDate   │   │
│ status       │   │   │ pickupLocation   │   │   │ message      │   │
│ profilePhoto │   │   │ pickupLat        │   │   │ status       │   │
│ createdAt    │   │   │ pickupLng        │   │   │ createdAt    │   │
│ updatedAt    │   │   │ deliveryLocation │   │   │ updatedAt    │   │
└──────┬───────┘   │   │ deliveryLng      │   │                      │
       │           │   │ pickupDate       │   │   ┌──────────────┐   │
       │           │   │ specialReqs      │   │   │   Message    │   │
       │           │   │ status           │   │   ├──────────────┤   │
       │           │   │ createdAt        │   │   │ id (PK)      │   │
       │           │   │ updatedAt        │   │   │ shipmentId   │──►│
       │           │   └──────────────────┘   │   │ senderId     │──►│
       │           │                          │   │ content      │   │
       │           │   ┌──────────────────┐   │   │ createdAt    │   │
       │           │   │     Vehicle      │   │   └──────────────┘   │
       │           │   ├──────────────────┤   │                      │
       │           │   │ id (PK)          │   │   ┌──────────────┐   │
       │           └───│ userId (FK)      │   │   │    Review    │   │
       │               │ type             │   │   ├──────────────┤   │
       │               │ capacityTons     │   │   │ id (PK)      │   │
       │               │ plateNumber      │   │   │ shipmentId   │──►┘
       │               │ createdAt        │   │   │ reviewerId   │──►┐
       │               │ updatedAt        │   │   │ revieweeId   │──►│
       │               └──────────────────┘   │   │ rating       │   │
       │                                      │   │ comment      │   │
       │          ┌──────────────────┐         │   │ createdAt    │   │
       │          │ ShipmentImage    │         │   └──────────────┘   │
       │          ├──────────────────┤         │                      │
       │          │ id (PK)          │         │   ┌──────────────┐   │
       │          │ shipmentId (FK)  │─────────┘   │ Notification │   │
       │          │ url              │             ├──────────────┤   │
       │          │ order            │             │ id (PK)      │   │
       │          │ createdAt        │             │ userId (FK)  │───┘
       │          └──────────────────┘             │ type         │
       │                                           │ title        │
       └───────────────────────────────────────────│ message      │
                                                   │ read         │
                                                   │ referenceId  │
                                                   │ createdAt    │
                                                   └──────────────┘
```

---

## 3. Entity Definitions

### 3.1 User

Owned by: `auth` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, auto-generated | Unique user identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | Login email |
| name | VARCHAR(100) | NOT NULL | Display name |
| phone | VARCHAR(20) | NULL until profile completion | Contact phone number |
| role | ENUM | NULL until profile completion | `SHIPPER`, `TRANSPORTER`, `ADMIN`; users choose `SHIPPER` or `TRANSPORTER` during completion |
| status | ENUM | NOT NULL, default `ACTIVE` | `ACTIVE`, `SUSPENDED` |
| profilePhoto | VARCHAR(500) | NULL | URL to profile image |
| location | VARCHAR(255) | NULL | User's city or region |
| createdAt | TIMESTAMP | NOT NULL, default now | Registration timestamp |
| updatedAt | TIMESTAMP | NOT NULL, auto-update | Last profile update |

Authentication credentials are managed by Better Auth. Email/password hashes are stored in `Account.password` for the `credential` provider; the `User` table does not duplicate password hashes. Better Auth's `image` field maps to the `profilePhoto` column.

Google OAuth may create an authenticated user before phone and marketplace role are known. Those fields remain nullable until the signed-in user completes their profile. Marketplace API access is blocked until both are set; normal email registration still requires both at signup.

The database enforces that `phone` and `role` are either both NULL or both populated.

### 3.2 Vehicle

Owned by: `auth` module (Transporter profile extension)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique vehicle identifier |
| userId | UUID | FK → User.id, UNIQUE | One vehicle per Transporter |
| type | VARCHAR(50) | NOT NULL | Vehicle type (truck, Isuzu, FSR, etc.) |
| capacityTons | DECIMAL(10,2) | NOT NULL | Load capacity in metric tons |
| plateNumber | VARCHAR(20) | NOT NULL | License plate number |
| createdAt | TIMESTAMP | NOT NULL | Record creation |
| updatedAt | TIMESTAMP | NOT NULL | Last update |

### 3.3 Shipment

Owned by: `shipment` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique shipment identifier |
| shipperId | UUID | FK → User.id, NOT NULL | Shipper who created the listing |
| goodsDescription | TEXT | NOT NULL | Description of goods to transport |
| goodsType | VARCHAR(50) | NOT NULL | Category of goods |
| weightKg | DECIMAL(10,2) | NOT NULL | Estimated weight in kilograms |
| pickupLocation | VARCHAR(255) | NOT NULL | Pickup address/area name |
| pickupLat | DECIMAL(10,7) | NULL | Pickup latitude |
| pickupLng | DECIMAL(10,7) | NULL | Pickup longitude |
| deliveryLocation | VARCHAR(255) | NOT NULL | Delivery address/area name |
| deliveryLat | DECIMAL(10,7) | NULL | Delivery latitude |
| deliveryLng | DECIMAL(10,7) | NULL | Delivery longitude |
| pickupDate | DATE | NOT NULL | Preferred pickup date |
| specialRequirements | TEXT | NULL | Free-text special instructions |
| status | ENUM | NOT NULL, default `DRAFT` | `DRAFT`, `PUBLISHED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` |
| createdAt | TIMESTAMP | NOT NULL | Listing creation |
| updatedAt | TIMESTAMP | NOT NULL | Last update |

### 3.4 ShipmentImage

Owned by: `shipment` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique image identifier |
| shipmentId | UUID | FK → Shipment.id, ON DELETE CASCADE | Parent shipment |
| url | VARCHAR(500) | NOT NULL | URL to stored image (Cloudinary/S3) |
| order | INTEGER | NOT NULL, default 0 | Display order |
| createdAt | TIMESTAMP | NOT NULL | Upload timestamp |

### 3.5 Bid

Owned by: `bid` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique bid identifier |
| shipmentId | UUID | FK → Shipment.id, NOT NULL | Target shipment |
| transporterId | UUID | FK → User.id, NOT NULL | Transporter who submitted |
| price | DECIMAL(12,2) | NOT NULL | Proposed price in ETB |
| pickupDate | TIMESTAMP | NOT NULL | Proposed pickup date/time |
| message | TEXT | NULL | Optional message to Shipper |
| status | ENUM | NOT NULL, default `PENDING` | `PENDING`, `ACCEPTED`, `DECLINED`, `WITHDRAWN` |
| declineReason | TEXT | NULL | Reason if declined by Shipper |
| createdAt | TIMESTAMP | NOT NULL | Bid submission time |
| updatedAt | TIMESTAMP | NOT NULL | Last update |

**Unique constraint:** `(shipmentId, transporterId)` WHERE `status = 'PENDING'` — one active bid per Transporter per Shipment.

### 3.6 Message

Owned by: `messaging` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique message identifier |
| shipmentId | UUID | FK → Shipment.id, NOT NULL | Shipment context |
| senderId | UUID | FK → User.id, NOT NULL | User who sent the message |
| content | TEXT | NOT NULL | Message body |
| createdAt | TIMESTAMP | NOT NULL | Sent timestamp |

### 3.7 Review

Owned by: `shipment` module (post-completion)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique review identifier |
| shipmentId | UUID | FK → Shipment.id, NOT NULL | Completed shipment |
| reviewerId | UUID | FK → User.id, NOT NULL | User leaving the review |
| revieweeId | UUID | FK → User.id, NOT NULL | User being reviewed |
| rating | INTEGER | NOT NULL, CHECK (1–5) | Star rating |
| comment | TEXT | NULL | Text review |
| createdAt | TIMESTAMP | NOT NULL | Review timestamp |

**Unique constraint:** `(shipmentId, reviewerId)` — one review per user per shipment.

### 3.8 Notification

Owned by: `notification` module

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique notification identifier |
| userId | UUID | FK → User.id, NOT NULL | Recipient |
| type | VARCHAR(50) | NOT NULL | e.g., `BID_RECEIVED`, `BID_ACCEPTED`, `NEW_MESSAGE` |
| title | VARCHAR(255) | NOT NULL | Notification title |
| message | TEXT | NOT NULL | Notification body |
| read | BOOLEAN | NOT NULL, default false | Read status |
| referenceId | UUID | NULL | Related entity ID (shipment, bid, etc.) |
| createdAt | TIMESTAMP | NOT NULL | Created timestamp |

---

## 4. Indexing Strategy

Indexes are created to support the primary query patterns identified in the functional requirements.

| Table | Index | Columns | Rationale |
|-------|-------|---------|-----------|
| User | `idx_user_email` | email (UNIQUE) | Login lookup |
| User | `idx_user_role_status` | role, status | Admin user filtering |
| Shipment | `idx_shipment_shipper` | shipperId | Dashboard: "my shipments" |
| Shipment | `idx_shipment_status` | status | Browse published shipments |
| Shipment | `idx_shipment_goods_type` | goodsType | Filter by goods type |
| Shipment | `idx_shipment_pickup_date` | pickupDate | Sort/filter by date |
| Shipment | `idx_shipment_created` | createdAt DESC | Sort by newest |
| Bid | `idx_bid_shipment` | shipmentId | Bids for a shipment |
| Bid | `idx_bid_transporter` | transporterId | Transporter's bid history |
| Bid | `idx_bid_shipment_transporter` | shipmentId, transporterId | Unique active bid check |
| Message | `idx_message_shipment` | shipmentId, createdAt | Message thread loading |
| Notification | `idx_notification_user` | userId, read, createdAt DESC | User's notification list |
| Review | `idx_review_reviewee` | revieweeId | Profile rating calculation |

---

## 5. Module-to-Table Ownership

Each module owns specific tables. No module writes directly to another module's tables.

| Module | Owned Tables |
|--------|-------------|
| auth | User, Vehicle, Session, Account, Verification (Better Auth managed) |
| shipment | Shipment, ShipmentImage, Review |
| bid | Bid |
| messaging | Message |
| notification | Notification |
| admin | No owned tables — reads from auth and shipment tables via their services |

---

## 6. Migration Strategy

| Aspect | Approach |
|--------|----------|
| Tool | Prisma Migrate |
| Workflow | Modify `schema.prisma` → run `npx prisma migrate dev --name <description>` → commit migration |
| Naming | Descriptive: `add_shipment_status_index`, `create_review_table` |
| Environments | Dev: `migrate dev` (interactive). Production: `migrate deploy` (non-interactive, applies pending migrations) |
| Rollback | Prisma does not support auto-rollback; create a new forward migration to undo changes |
| Seed data | `prisma/seed.js` for development data (admin user, sample listings) |

---

## 7. Data Integrity Rules

| Rule | Implementation |
|------|---------------|
| Referential integrity | Foreign keys with appropriate ON DELETE behavior |
| Shipment images cascade | `ON DELETE CASCADE` — deleting a shipment removes its images |
| Bids reference protection | `ON DELETE RESTRICT` — cannot delete a shipment that has bids (cancel instead) |
| Messages reference protection | `ON DELETE RESTRICT` — cannot delete shipment with messages |
| Review immutability | No UPDATE operations on Review table (enforced in service layer) |
| Single vehicle per transporter | UNIQUE constraint on `Vehicle.userId` |
| One active bid per transporter per shipment | Partial unique index on `(shipmentId, transporterId)` where status is `PENDING` |
| Rating range | CHECK constraint: `rating >= 1 AND rating <= 5` |

---

## 8. Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | PascalCase (Prisma models) | `Shipment`, `ShipmentImage` |
| Column names | camelCase | `shipperId`, `pickupDate`, `createdAt` |
| Enum values | UPPER_SNAKE_CASE | `IN_PROGRESS`, `BID_RECEIVED` |
| Index names | `idx_<table>_<columns>` | `idx_shipment_status` |
| Foreign keys | `<relatedEntity>Id` | `shipperId`, `transporterId` |
| Timestamps | `createdAt`, `updatedAt` | Consistent across all tables |
