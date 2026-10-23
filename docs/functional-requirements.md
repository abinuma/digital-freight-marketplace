# Functional Requirements

**Project:** FETAN Digital Freight Marketplace  



## Authentication & User Management
- The system must allow users to register as either a Shipper or a Transporter by providing name, email, phone number, and password.
- The system must authenticate users via email and password.
- The system must support password reset via email link.
- The system must enforce role-based access control with three roles: Shipper, Transporter, Admin.
- Users must be able to view and update their profile information (name, phone, location, profile photo).
- Transporters must be able to add vehicle details to their profile (vehicle type, capacity in tons, plate number).
- The system must manage user sessions with secure token-based authentication via Better Auth.
- The system must support social login via Google OAuth.

## Shipment Management
- Shippers must be able to create a new shipment listing.
- A shipment listing must include: goods description, goods type, estimated weight (kg), pickup location, delivery location, preferred pickup date, and special requirements (free text).
- Shippers must be able to edit a shipment listing while it is in PUBLISHED status and has no accepted bids.
- Shippers must be able to cancel a shipment listing at any time before it is marked COMPLETED.
- Shipment listings must follow a status lifecycle: `PUBLISHED → IN_PROGRESS → COMPLETED` or `CANCELLED` (from any status except COMPLETED).
- Shippers should be able to attach images to a shipment listing.
- Only the Shipper who created a listing must be able to edit, cancel, or manage it.
- Completed and cancelled shipments should remain visible to their owner in their dashboard but should not appear in public search results.

## Discovery & Search
- Transporters must be able to browse all shipment listings with PUBLISHED status.
- The system must support filtering shipments by: pickup location (region/city), delivery location (region/city), goods type.
- Search results should be sortable by: date posted (newest first), preferred pickup date.
- Search results must be paginated with a configurable page size (default: 20 items per page).

## Bidding & Response
- Transporters must be able to submit a bid on any shipment with PUBLISHED status.
- A bid must include: proposed price (ETB),and estimated pickup date/time.
- Transporters must be able to update or withdraw a pending bid before it is accepted or declined.
- Shippers must be able to view all bids received on their shipment, sorted by date submitted.
- Shippers must be able to accept one bid per shipment. Accepting a bid must automatically decline all other pending bids on that shipment.
- Accepting a bid must transition the shipment status from PUBLISHED to IN_PROGRESS.
- Shippers should be able to individually decline a bid with an optional reason.
- The system should notify the Transporter when their bid is accepted or declined.
- A Transporter must not be able to submit more than one active bid on the same shipment.

## Communication
- The system should provide a private messaging channel between a Shipper and each Transporter within the context of a specific shipment.
- Messages should be persisted and retrievable by both participants, and users should be able to view their shipment conversations in a dedicated Messages page.
- Users could see a visual indicator (badge/count) for unread messages.
- Sending messages should only be available between parties who have a pending or accepted bid on a shipment; participants may read conversation history after the bid closes.

## Shipment Completion & Reviews
- Shippers must be able to mark a shipment as COMPLETED after transport is finished.
- After completion, the Shipper should be able to leave a rating (1–5 stars) and a text review for the transporter.
- User profiles should display an average rating and total review count based on received reviews.
- Reviews should be immutable once submitted.

## Administration
- Admins must be able to view and search all registered users with filters by role and status.
- Admins must be able to deactivate or suspend a user account with a reason.
- The admin dashboard should display key metrics: total users (by role), active shipments, completed shipments.
- Admins could be able to view user-submitted reports and take moderation action .
- Suspended users must be able to submit an appeal message, and admins must be able to view submitted appeals.

## Notifications
- The system should send email notifications for: registration confirmation, password reset, bid received (to Shipper), and bid accepted/declined (to Transporter).
- The system should provide in-app notifications for: new bid received, bid status change, new message, and shipment status change.
