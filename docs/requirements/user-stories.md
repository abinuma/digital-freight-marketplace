# User Stories

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Parent Document:** [srs.md](./srs.md)  

---

## Format

Each user story follows the standard format:

> **As a** [role], **I want** [goal], **so that** [benefit].

Stories include acceptance criteria and trace back to functional requirement IDs defined in [functional-requirements.md](./functional-requirements.md).

---

## 1. Shipper Stories

### US-S01: Register as a Shipper

**As a** Shipper, **I want** to create an account on the platform, **so that** I can post shipment requests and find transporters.

**Acceptance Criteria:**
- I can register by providing my name, email, phone number, and password.
- I select "Shipper" as my role during registration.
- I receive a confirmation email after registration.
- I can log in immediately after registering.

**Traces to:** FR-001, FR-002, FR-700

---

### US-S02: Manage My Profile

**As a** Shipper, **I want** to view and update my profile information, **so that** transporters can see accurate contact details.

**Acceptance Criteria:**
- I can update my name, phone number, location, and profile photo.
- Changes are saved and reflected immediately.

**Traces to:** FR-005

---

### US-S03: Create a Shipment Listing

**As a** Shipper, **I want** to create a shipment listing with details about my freight, **so that** transporters can discover it and submit bids.

**Acceptance Criteria:**
- I can enter goods description, goods type, estimated weight, pickup location, delivery location, preferred pickup date, and special requirements.
- I can save the listing as a draft before publishing.
- I can attach up to 5 images of my goods.
- I can select pickup and delivery locations using a map.
- After publishing, the listing is visible to all Transporters.

**Traces to:** FR-100, FR-101, FR-104, FR-105

---

### US-S04: Edit a Shipment Listing

**As a** Shipper, **I want** to edit my shipment listing, **so that** I can correct mistakes or update details before a bid is accepted.

**Acceptance Criteria:**
- I can edit any field of a listing in DRAFT or PUBLISHED status.
- I cannot edit a listing that has an accepted bid (IN_PROGRESS).
- Edits are saved and reflected to Transporters viewing the listing.

**Traces to:** FR-102, FR-106

---

### US-S05: Cancel a Shipment

**As a** Shipper, **I want** to cancel a shipment listing, **so that** I can withdraw a request I no longer need.

**Acceptance Criteria:**
- I can cancel from any status except COMPLETED.
- Cancellation changes the status to CANCELLED.
- Pending bids on the shipment are automatically declined on cancellation.
- The cancelled shipment remains visible in my dashboard.

**Traces to:** FR-103, FR-104, FR-107

---

### US-S06: View Bids on My Shipment

**As a** Shipper, **I want** to see all bids submitted on my shipment, **so that** I can compare offers and choose the best transporter.

**Acceptance Criteria:**
- I see a list of all bids with proposed price, pickup date, and transporter details.
- Bids are sorted by date submitted.
- I can view the Transporter's profile and rating from the bid.

**Traces to:** FR-303, FR-502

---

### US-S07: Accept a Bid

**As a** Shipper, **I want** to accept a bid from a transporter, **so that** we can proceed with the transport arrangement.

**Acceptance Criteria:**
- I can accept one bid per shipment.
- Accepting a bid changes the shipment status to IN_PROGRESS.
- All other pending bids on the shipment are automatically declined.
- The accepted Transporter is notified.

**Traces to:** FR-304, FR-305, FR-307

---

### US-S08: Decline a Bid

**As a** Shipper, **I want** to decline a bid I am not interested in, **so that** the transporter knows their offer was not selected.

**Acceptance Criteria:**
- I can decline individual bids with an optional reason.
- The Transporter is notified of the decline.

**Traces to:** FR-306, FR-307

---

### US-S09: Mark Shipment as Completed

**As a** Shipper, **I want** to mark a shipment as completed, **so that** the transaction is closed and I can leave a review.

**Acceptance Criteria:**
- I can mark an IN_PROGRESS shipment as COMPLETED.
- After completion, I am prompted to leave a rating and review.

**Traces to:** FR-500, FR-501

---

### US-S10: Leave a Review

**As a** Shipper, **I want** to rate and review the transporter after delivery, **so that** other shippers can make informed decisions.

**Acceptance Criteria:**
- I can leave a 1–5 star rating and a text review.
- The review is displayed on the Transporter's profile.
- I cannot edit or delete a submitted review.

**Traces to:** FR-501, FR-502, FR-503

---

### US-S11: Send a Message to a Transporter

**As a** Shipper, **I want** to message a transporter about my shipment, **so that** I can discuss details or clarify requirements.

**Acceptance Criteria:**
- I can send and receive messages within the context of a shipment.
- I can only message Transporters who have active bids or accepted arrangements on my shipment.
- Messaging history is persisted and retrievable.
- Each Transporter has a private conversation with me, and my previous conversations appear on a Messages page.

**Traces to:** FR-400, FR-401, FR-403

---

## 2. Transporter Stories

### US-T01: Register as a Transporter

**As a** Transporter, **I want** to create an account on the platform, **so that** I can discover freight opportunities and submit bids.

**Acceptance Criteria:**
- I can register by providing my name, email, phone number, and password.
- I select "Transporter" as my role during registration.
- I receive a confirmation email after registration.

**Traces to:** FR-001, FR-002, FR-700

---

### US-T02: Add Vehicle Details

**As a** Transporter, **I want** to add my vehicle details to my profile, **so that** shippers can see what I can transport.

**Acceptance Criteria:**
- I can enter vehicle type (e.g., truck, Isuzu, FSR), capacity in tons, and plate number.
- Vehicle details are displayed on my profile.

**Traces to:** FR-006

---

### US-T03: Browse Available Shipments

**As a** Transporter, **I want** to browse all published shipment listings, **so that** I can find freight opportunities that match my route and capacity.

**Acceptance Criteria:**
- I see a paginated list of all PUBLISHED shipments.
- I can view shipment details including goods description, weight, locations, and dates.
- I can see shipment locations on a map.

**Traces to:** FR-200, FR-203, FR-205

---

### US-T04: Search and Filter Shipments

**As a** Transporter, **I want** to search and filter shipments, **so that** I can quickly find relevant freight opportunities.

**Acceptance Criteria:**
- I can filter by pickup location, delivery location, goods type, and date range.
- I can sort results by date posted, pickup date, or distance.
- I can search by keywords in the goods description.

**Traces to:** FR-201, FR-202, FR-204

---

### US-T05: Submit a Bid

**As a** Transporter, **I want** to submit a bid on a shipment, **so that** the shipper can consider hiring me for transport.

**Acceptance Criteria:**
- I can submit a bid with proposed price (ETB), estimated pickup date/time, and an optional message.
- I cannot submit more than one active bid on the same shipment.
- The Shipper is notified when I submit a bid.

**Traces to:** FR-300, FR-301, FR-308, FR-700

---

### US-T06: Update or Withdraw a Bid

**As a** Transporter, **I want** to update or withdraw my bid, **so that** I can adjust my offer or remove it if my availability changes.

**Acceptance Criteria:**
- I can update the price, date, or message on my pending bid.
- I can withdraw my bid entirely before it is accepted or declined.
- Withdrawn bids are no longer visible to the Shipper.

**Traces to:** FR-302

---

### US-T07: Receive Bid Notifications

**As a** Transporter, **I want** to be notified when my bid is accepted or declined, **so that** I know whether to proceed with the shipment.

**Acceptance Criteria:**
- I receive an email and/or in-app notification when my bid is accepted.
- I receive a notification when my bid is declined, including any reason provided.

**Traces to:** FR-307, FR-700, FR-701

---

### US-T08: Leave a Review for a Shipper

**As a** Transporter, **I want** to rate and review the shipper after completing a delivery, **so that** other transporters can make informed decisions.

**Acceptance Criteria:**
- I can leave a 1–5 star rating and a text review after shipment completion.
- The review is displayed on the Shipper's profile.

**Traces to:** FR-501, FR-502

---

### US-T09: Message a Shipper

**As a** Transporter, **I want** to message a shipper about a shipment, **so that** I can ask questions or discuss logistics.

**Acceptance Criteria:**
- I can send and receive messages in the context of a shipment I have an active bid or arrangement on.
- I see an unread message indicator.
- My previous shipment conversations appear on a Messages page and remain readable after a bid closes.

**Traces to:** FR-400, FR-401, FR-402, FR-403

---

## 3. Admin Stories

### US-A01: View All Users

**As an** Admin, **I want** to view and search all registered users, **so that** I can monitor the platform's user base.

**Acceptance Criteria:**
- I can see a list of all users with their name, email, role, registration date, and status.
- I can filter by role (Shipper, Transporter) and status (active, suspended).
- I can search by name or email.

**Traces to:** FR-600

---

### US-A02: Suspend a User

**As an** Admin, **I want** to deactivate or suspend a user account, **so that** I can enforce platform rules.

**Acceptance Criteria:**
- I can suspend a user account with a recorded reason.
- Suspended users cannot log in or perform actions.
- I can reactivate a suspended account.

**Traces to:** FR-601

---

### US-A03: Moderate Shipment Listings

**As an** Admin, **I want** to view and manage all shipment listings, **so that** I can remove inappropriate or fraudulent content.

**Acceptance Criteria:**
- I can view all listings with their status.
- I can filter listings by status.
- I can hide or remove a listing that violates platform rules.

**Traces to:** FR-602, FR-603

---

### US-A04: View Platform Metrics

**As an** Admin, **I want** to see key platform metrics on my dashboard, **so that** I can understand platform health and growth.

**Acceptance Criteria:**
- I see total registered users broken down by role.
- I see active, completed, and cancelled shipment counts.
- I see new registrations in the last 30 days.

**Traces to:** FR-604

---

### US-A05: Handle Reports

**As an** Admin, **I want** to review reported content and user complaints, **so that** I can take appropriate moderation action.

**Acceptance Criteria:**
- I can view a queue of submitted reports.
- I can take action: warn user, suspend user, or remove content.
- Resolved reports are archived.

**Traces to:** FR-605

---

## 4. Common Stories

### US-C01: Reset Password

**As a** registered user, **I want** to reset my password via email, **so that** I can regain access to my account if I forget my credentials.

**Acceptance Criteria:**
- I can request a password reset by entering my email.
- I receive an email with a secure reset link.
- The reset link expires after a configured time (e.g., 1 hour).
- I can set a new password using the link.

**Traces to:** FR-003

---

### US-C02: View Notifications

**As a** registered user, **I want** to see my notifications in the app, **so that** I stay informed about shipment and bid activity.

**Acceptance Criteria:**
- I see a notification icon with an unread count.
- I can view a list of my notifications.
- Clicking a notification takes me to the relevant page.

**Traces to:** FR-701, FR-702

---

## Story Summary

| Group | Count |
|-------|-------|
| Shipper Stories (US-S) | 11 |
| Transporter Stories (US-T) | 9 |
| Admin Stories (US-A) | 5 |
| Common Stories (US-C) | 2 |
| **Total** | **27** |
