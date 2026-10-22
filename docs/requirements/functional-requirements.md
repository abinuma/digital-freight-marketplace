# Functional Requirements

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Parent Document:** [srs.md](./srs.md)  

---

## Conventions

- Requirements are identified as **FR-XXX**.
- Priority uses **MoSCoW**: Must | Should | Could | Won't (for V1).
- Each requirement maps to one or more user stories in [user-stories.md](./user-stories.md).

---

## 1. Authentication & User Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | The system shall allow users to register as either a Shipper or a Transporter by providing name, email, phone number, and password. | Must |
| FR-002 | The system shall authenticate users via email and password. | Must |
| FR-003 | The system shall support password reset via email link. | Must |
| FR-004 | The system shall enforce role-based access control with three roles: Shipper, Transporter, Admin. | Must |
| FR-005 | Users shall be able to view and update their profile information (name, phone, location, profile photo). | Must |
| FR-006 | Transporters shall be able to add vehicle details to their profile (vehicle type, capacity in tons, plate number). | Must |
| FR-007 | The system shall manage user sessions with secure token-based authentication via Better Auth. | Must |
| FR-008 | The system shall support social login via Google OAuth. | Must |

---

## 2. Shipment Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-100 | Shippers shall be able to create a new shipment listing. | Must |
| FR-101 | A shipment listing shall include: goods description, goods type, estimated weight (kg), pickup location, delivery location, preferred pickup date, and special requirements (free text). | Must |
| FR-102 | Shippers shall be able to edit a shipment listing while it is in DRAFT or PUBLISHED status and has no accepted bids. | Must |
| FR-103 | Shippers shall be able to cancel a shipment listing at any time before it is marked COMPLETED. | Must |
| FR-104 | Shipment listings shall follow a status lifecycle: `DRAFT → PUBLISHED → IN_PROGRESS → COMPLETED` or `CANCELLED` (from any status except COMPLETED). | Must |
| FR-105 | Shippers shall be able to attach up to 5 images to a shipment listing. | Should |
| FR-106 | Only the Shipper who created a listing shall be able to edit, cancel, or manage it. | Must |
| FR-107 | Completed and cancelled shipments shall remain visible to their owner in their dashboard but shall not appear in public search results. | Should |

### Shipment Status Lifecycle

```
DRAFT ──→ PUBLISHED ──→ IN_PROGRESS ──→ COMPLETED
              │               │
              └───→ CANCELLED ←┘
```

- **DRAFT:** Created but not yet visible to Transporters.
- **PUBLISHED:** Visible in search; open for bids.
- **IN_PROGRESS:** A bid has been accepted; transport is underway.
- **COMPLETED:** Transport finished; both parties can leave reviews.
- **CANCELLED:** Shipment withdrawn by the Shipper.

---

## 3. Discovery & Search

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-200 | Transporters shall be able to browse all shipment listings with PUBLISHED status. | Must |
| FR-201 | The system shall support filtering shipments by: pickup location (region/city), delivery location (region/city), goods type, and date range. | Must |
| FR-202 | Search results shall be sortable by: date posted (newest first), preferred pickup date, and distance from Transporter's location. | Should |
| FR-203 | The system shall display shipment pickup and delivery locations on an interactive map (Leaflet + OpenStreetMap). | Should |
| FR-204 | The system shall support text-based search across shipment goods description and special requirements. | Should |
| FR-205 | Search results shall be paginated with a configurable page size (default: 20 items per page). | Must |

---

## 4. Bidding & Response

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-300 | Transporters shall be able to submit a bid on any shipment with PUBLISHED status. | Must |
| FR-301 | A bid shall include: proposed price (ETB), estimated pickup date/time, and an optional message to the Shipper. | Must |
| FR-302 | Transporters shall be able to update or withdraw a pending bid before it is accepted or declined. | Must |
| FR-303 | Shippers shall be able to view all bids received on their shipment, sorted by date submitted. | Must |
| FR-304 | Shippers shall be able to accept one bid per shipment. Accepting a bid shall automatically decline all other pending bids on that shipment. | Must |
| FR-305 | Accepting a bid shall transition the shipment status from PUBLISHED to IN_PROGRESS. | Must |
| FR-306 | Shippers shall be able to individually decline a bid with an optional reason. | Should |
| FR-307 | The system shall notify the Transporter when their bid is accepted or declined. | Should |
| FR-308 | A Transporter shall not be able to submit more than one active bid on the same shipment. | Must |

### Bid Status Lifecycle

```
PENDING ──→ ACCEPTED
    │
    ├──→ DECLINED
    │
    └──→ WITHDRAWN (by Transporter)
```

---

## 5. Communication

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-400 | The system shall provide a private messaging channel between a Shipper and each Transporter within the context of a specific shipment. | Should |
| FR-401 | Messages shall be persisted and retrievable by both participants, and users shall be able to view their shipment conversations in a dedicated Messages page. | Should |
| FR-402 | Users shall see a visual indicator (badge/count) for unread messages. | Could |
| FR-403 | Sending messages shall only be available between parties who have a pending or accepted bid on a shipment; participants may read conversation history after the bid closes. | Should |

---

## 6. Shipment Completion & Reviews

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-500 | Shippers shall be able to mark a shipment as COMPLETED after transport is finished. | Must |
| FR-501 | After completion, both the Shipper and the Transporter shall be able to leave a rating (1–5 stars) and a text review for the other party. | Should |
| FR-502 | User profiles shall display an average rating and total review count based on received reviews. | Should |
| FR-503 | Reviews shall be immutable once submitted. | Should |

---

## 7. Administration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-600 | Admins shall be able to view and search all registered users with filters by role and status. | Must |
| FR-601 | Admins shall be able to deactivate or suspend a user account with a reason. | Must |
| FR-602 | Admins shall be able to view all shipment listings and filter by status. | Must |
| FR-603 | Admins shall be able to remove or hide shipment listings that violate platform rules. | Must |
| FR-604 | The admin dashboard shall display key metrics: total users (by role), active shipments, completed shipments, and new registrations (last 30 days). | Should |
| FR-605 | Admins shall be able to view user-submitted reports and take moderation actions (warn, suspend, remove content). | Could |
| FR-606 | Suspended users shall be able to submit an appeal message, and admins shall be able to view submitted appeals. | Must |

---

## 8. Notifications

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-700 | The system shall send email notifications for: registration confirmation, password reset, bid received (to Shipper), and bid accepted/declined (to Transporter). | Should |
| FR-701 | The system should provide in-app notifications for: new bid received, bid status change, new message, and shipment status change. | Could |
| FR-702 | Users shall be able to view a list of their notifications within the application. | Could |

---

## Requirement Summary

| Area | ID Range | Total | Must | Should | Could |
|------|----------|-------|------|--------|-------|
| Authentication & Users | FR-001 – FR-008 | 8 | 8 | 0 | 0 |
| Shipment Management | FR-100 – FR-107 | 8 | 5 | 3 | 0 |
| Discovery & Search | FR-200 – FR-205 | 6 | 3 | 3 | 0 |
| Bidding & Response | FR-300 – FR-308 | 9 | 7 | 2 | 0 |
| Communication | FR-400 – FR-403 | 4 | 0 | 3 | 1 |
| Completion & Reviews | FR-500 – FR-503 | 4 | 1 | 3 | 0 |
| Administration | FR-600 – FR-605 | 6 | 4 | 1 | 1 |
| Notifications | FR-700 – FR-702 | 3 | 0 | 1 | 2 |
| **Total** | | **48** | **28** | **16** | **4** |
