# Use Cases

**Project:** Digital Freight Marketplace  
**Version:** 1.0  
**Date:** 2026-10-03  
**Parent Document:** [srs.md](./srs.md)  

---

## Format

Each use case follows a structured template:

- **ID & Name** — Unique identifier and descriptive title.
- **Actor(s)** — Who initiates or participates in the use case.
- **Preconditions** — What must be true before the use case begins.
- **Main Flow** — The standard sequence of steps (happy path).
- **Alternate Flows** — Branches from the main flow (errors, edge cases).
- **Postconditions** — The system state after successful completion.
- **Traces to** — Functional requirement IDs from [functional-requirements.md](./functional-requirements.md).

---

## UC-01: User Registration

**Actors:** Shipper or Transporter (unregistered user)

**Preconditions:**
- The user does not have an existing account.

**Main Flow:**
1. User navigates to the registration page.
2. User selects their role: Shipper or Transporter.
3. User enters their name, email address, phone number, and password.
4. System validates the input (email format, password strength, unique email).
5. System creates the user account and assigns the selected role.
6. System sends a registration confirmation email.
7. System redirects the user to their role-specific dashboard.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-01a | Email already registered | System displays "An account with this email already exists." User is prompted to log in or reset password. |
| AF-01b | Validation failure | System displays inline errors for invalid fields. User corrects and resubmits. |

**Postconditions:**
- A new user account exists with the selected role.
- The user is authenticated and on their dashboard.

**Traces to:** FR-001, FR-002, FR-004, FR-700

---

## UC-02: User Login

**Actors:** Registered user (Shipper, Transporter, or Admin)

**Preconditions:**
- The user has a registered account.

**Main Flow:**
1. User navigates to the login page.
2. User enters their email and password.
3. System validates credentials.
4. System creates an authenticated session.
5. System redirects the user to their role-specific dashboard.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-02a | Invalid credentials | System displays "Invalid email or password." Login attempt is rate-limited. |
| AF-02b | Account suspended | System redirects any active session to the landing page. On login, system explains the suspension, provides the support message, and allows the user to submit an appeal message to the Admin. Login is denied. |

**Postconditions:**
- The user has an active session and is on their dashboard.

**Traces to:** FR-002, FR-007

---

## UC-03: Create Shipment Listing

**Actors:** Shipper

**Preconditions:**
- The Shipper is logged in.

**Main Flow:**
1. Shipper navigates to "Create Shipment" page.
2. Shipper enters shipment details:
   - Goods description (text)
   - Goods type (selection)
   - Estimated weight in kg (number)
   - Pickup location (map picker or text input)
   - Delivery location (map picker or text input)
   - Preferred pickup date (date picker)
   - Special requirements (optional text)
3. Shipper optionally attaches images (up to 5).
4. Shipper saves the listing as DRAFT or publishes directly.
5. System validates all required fields.
6. System creates the shipment record.
7. If published, the listing becomes visible to Transporters in search results.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-03a | Validation failure | System displays inline errors. Shipper corrects and resubmits. |
| AF-03b | Save as DRAFT | System saves the listing as DRAFT. It is not visible in search. Shipper can return to edit and publish later. |
| AF-03c | Image upload failure | System displays error for the failed image. Other valid images are retained. Shipper can retry. |

**Postconditions:**
- A new shipment record exists in DRAFT or PUBLISHED status.
- If PUBLISHED, the listing appears in Transporter search results.

**Traces to:** FR-100, FR-101, FR-104, FR-105

---

## UC-04: Search and Browse Shipments

**Actors:** Transporter

**Preconditions:**
- The Transporter is logged in.

**Main Flow:**
1. Transporter navigates to the shipment discovery page.
2. System displays a paginated list of PUBLISHED shipments with a map view.
3. Transporter optionally applies filters (pickup location, delivery location, goods type, date range).
4. Transporter optionally enters a text search query.
5. System returns matching results, paginated.
6. Transporter clicks on a shipment to view its full details.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-04a | No results found | System displays "No shipments match your search. Try adjusting your filters." |

**Postconditions:**
- The Transporter has viewed available shipments. No data is modified.

**Traces to:** FR-200, FR-201, FR-202, FR-203, FR-204, FR-205

---

## UC-05: Submit a Bid

**Actors:** Transporter

**Preconditions:**
- The Transporter is logged in.
- The shipment is in PUBLISHED status.
- The Transporter does not have an existing active bid on this shipment.

**Main Flow:**
1. Transporter views a shipment detail page.
2. Transporter clicks "Submit Bid."
3. Transporter enters:
   - Proposed price in ETB (number)
   - Estimated pickup date/time (date-time picker)
   - Optional message to the Shipper (text)
4. System validates the input.
5. System creates the bid with PENDING status.
6. System notifies the Shipper that a new bid has been received.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-05a | Transporter already has a bid | System displays "You already have an active bid on this shipment." Bid form is hidden. |
| AF-05b | Shipment no longer PUBLISHED | System displays "This shipment is no longer accepting bids." |
| AF-05c | Validation failure | System displays inline errors. Transporter corrects and resubmits. |

**Postconditions:**
- A new bid record exists with PENDING status linked to the shipment and Transporter.
- The Shipper has been notified.

**Traces to:** FR-300, FR-301, FR-308, FR-307, FR-700

---

## UC-06: Review and Accept a Bid

**Actors:** Shipper

**Preconditions:**
- The Shipper is logged in.
- The shipment is in PUBLISHED status.
- At least one bid has been submitted.

**Main Flow:**
1. Shipper navigates to their shipment detail page.
2. Shipper views the list of received bids (price, date, Transporter profile, rating).
3. Shipper selects a bid and clicks "Accept."
4. System prompts for confirmation.
5. Shipper confirms acceptance.
6. System updates the selected bid to ACCEPTED.
7. System automatically declines all other pending bids on the shipment.
8. System transitions the shipment status from PUBLISHED to IN_PROGRESS.
9. System notifies the accepted Transporter.
10. System notifies all declined Transporters.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-06a | Shipper declines a bid | Shipper clicks "Decline" on a specific bid. Optionally enters a reason. System updates the bid to DECLINED and notifies the Transporter. |
| AF-06b | All bids declined | If the Shipper declines all bids, the shipment remains in PUBLISHED status and continues to accept new bids. |

**Postconditions:**
- One bid is ACCEPTED; the shipment is IN_PROGRESS.
- All other pending bids are DECLINED.
- All relevant parties are notified.

**Traces to:** FR-303, FR-304, FR-305, FR-306, FR-307

---

## UC-07: Complete a Shipment

**Actors:** Shipper

**Preconditions:**
- The Shipper is logged in.
- The shipment is in IN_PROGRESS status.

**Main Flow:**
1. Shipper navigates to the shipment detail page.
2. Shipper clicks "Mark as Completed."
3. System prompts for confirmation.
4. Shipper confirms.
5. System transitions the shipment status to COMPLETED.
6. System prompts Shipper to leave a rating and review for the Transporter.
7. Shipper enters a star rating (1–5) and optional text review.
8. System saves the review and updates the Transporter's average rating.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-07a | Shipper skips review | Shipper dismisses the review prompt. The shipment is still marked as COMPLETED. Shipper can leave a review later from the shipment page. |

**Postconditions:**
- The shipment is in COMPLETED status.
- A review may have been created for the Transporter.

**Traces to:** FR-500, FR-501, FR-502, FR-503

---

## UC-08: Messaging Between Parties

**Actors:** Shipper and Transporter

**Preconditions:**
- Both users are logged in.
- The Transporter has an active bid or accepted arrangement on the Shipper's shipment.

**Main Flow:**
1. Either party navigates to the shipment detail or messaging page.
2. User types a message and sends it.
3. System persists the message with sender, timestamp, and shipment context.
4. The recipient sees the message in the conversation thread.
5. An unread indicator is updated for the recipient.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-08a | No active bid/arrangement | The messaging option is not available. System does not allow message creation. |

**Postconditions:**
- A new message exists in the conversation thread for the shipment.

**Traces to:** FR-400, FR-401, FR-402, FR-403

---

## UC-09: Admin — Suspend a User

**Actors:** Admin

**Preconditions:**
- The Admin is logged in.

**Main Flow:**
1. Admin navigates to the user management page.
2. Admin searches for or browses to a specific user.
3. Admin clicks "Suspend" on the user's record.
4. Admin enters a reason for suspension.
5. System updates the user's status to SUSPENDED.
6. Any active session is redirected to the landing page, and the suspended user cannot log in until reactivated.
7. The suspended user can submit an appeal message from the login page for Admin review.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-09a | Reactivate user | Admin clicks "Reactivate" on a suspended user. System restores ACTIVE status. User can log in again. |

**Postconditions:**
- The user's account status is SUSPENDED.
- The user cannot log in or perform marketplace actions until reactivated.

**Traces to:** FR-601

---

## UC-10: Admin — Moderate a Shipment Listing

**Actors:** Admin

**Preconditions:**
- The Admin is logged in.

**Main Flow:**
1. Admin navigates to the shipment management page.
2. Admin views shipment listings, optionally filtering by status.
3. Admin identifies a listing that violates platform rules.
4. Admin clicks "Remove" on the listing.
5. System prompts for a reason.
6. Admin enters the reason and confirms.
7. System hides the listing from public view and records the moderation action.

**Alternate Flows:**

| ID | Condition | Steps |
|----|-----------|-------|
| AF-10a | Listing has active bids | System notifies affected Transporters that the shipment has been removed by administration. Active bids are cancelled. |

**Postconditions:**
- The listing is no longer visible in public search.
- A moderation audit record exists.

**Traces to:** FR-602, FR-603

---

## UC-11: Submit and Review a Suspension Appeal

**Actors:** Suspended user, Admin

**Preconditions:**
- The user's account status is SUSPENDED.

**Main Flow:**
1. The user attempts to log in and sees the suspension notice and support guidance.
2. The user selects **Request an appeal**, enters a message, and submits it.
3. The system stores the appeal with the user's account and submission date.
4. An Admin opens the Suspension appeals section in user management and reads the appeal.

**Postconditions:**
- The appeal is available for Admin review.
- The account remains suspended unless an Admin separately reactivates it.

**Traces to:** FR-606

---

## Use Case Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │        Digital Freight Marketplace          │
                    │                                             │
                    │  ┌──────────────┐   ┌──────────────────┐   │
  ┌──────────┐     │  │ UC-01:       │   │ UC-02:           │   │
  │          │     │  │ Register     │   │ Login            │   │
  │  User    ├────►│  └──────────────┘   └──────────────────┘   │
  │(common)  │     │  ┌──────────────────────────────────────┐   │
  └──────────┘     │  │ UC-08: Messaging Between Parties     │   │
                    │  └──────────────────────────────────────┘   │
  ┌──────────┐     │  ┌──────────────┐   ┌──────────────────┐   │
  │          │     │  │ UC-03:       │   │ UC-06:           │   │
  │ Shipper  ├────►│  │ Create       │   │ Review &         │   │
  │          │     │  │ Shipment     │   │ Accept Bid       │   │
  └──────────┘     │  └──────────────┘   └──────────────────┘   │
                    │  ┌──────────────┐   ┌──────────────────┐   │
                    │  │ UC-05:       │   │ UC-07:           │   │
                    │  │ Cancel       │   │ Complete         │   │
                    │  │ Shipment     │   │ Shipment         │   │
                    │  └──────────────┘   └──────────────────┘   │
  ┌──────────┐     │  ┌──────────────┐   ┌──────────────────┐   │
  │          │     │  │ UC-04:       │   │ UC-05:           │   │
  │Transporter├───►│  │ Search &     │   │ Submit           │   │
  │          │     │  │ Browse       │   │ Bid              │   │
  └──────────┘     │  └──────────────┘   └──────────────────┘   │
                    │                                             │
  ┌──────────┐     │  ┌──────────────┐   ┌──────────────────┐   │
  │          │     │  │ UC-09:       │   │ UC-10:           │   │
  │  Admin   ├────►│  │ Suspend      │   │ Moderate         │   │
  │          │     │  │ User         │   │ Listing          │   │
  └──────────┘     │  └──────────────┘   └──────────────────┘   │
                    │                                             │
                    └─────────────────────────────────────────────┘
```

---

## Use Case Summary

| ID | Use Case | Primary Actor | Priority |
|----|----------|---------------|----------|
| UC-01 | User Registration | Shipper / Transporter | Must |
| UC-02 | User Login | All users | Must |
| UC-03 | Create Shipment Listing | Shipper | Must |
| UC-04 | Search and Browse Shipments | Transporter | Must |
| UC-05 | Submit a Bid | Transporter | Must |
| UC-06 | Review and Accept a Bid | Shipper | Must |
| UC-07 | Complete a Shipment | Shipper | Must |
| UC-08 | Messaging Between Parties | Shipper / Transporter | Should |
| UC-09 | Suspend a User | Admin | Must |
| UC-10 | Moderate a Shipment Listing | Admin | Must |
| UC-11 | Submit and Review a Suspension Appeal | Suspended user / Admin | Must |
