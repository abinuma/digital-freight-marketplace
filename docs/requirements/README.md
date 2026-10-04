# Requirements Documentation

**Project:** Digital Freight Marketplace  
**Last Updated:** 2026-10-03  

---

## Overview

This directory contains the complete requirements documentation for the Digital Freight Marketplace — a two-sided web platform connecting shippers who need road freight transport with transporters who provide it across Ethiopia.

All requirements are derived from the [Product Overview](../product-overview.md) and reflect the agreed project scope.

## Documents

| Document | Description |
|----------|-------------|
| [srs.md](./srs.md) | Software Requirements Specification — system scope, description, external interfaces, constraints, and assumptions |
| [functional-requirements.md](./functional-requirements.md) | All functional requirements organized by feature area with MoSCoW priority |
| [non-functional-requirements.md](./non-functional-requirements.md) | Quality attributes — performance, security, usability, reliability, maintainability, scalability |
| [user-stories.md](./user-stories.md) | User stories grouped by role (Shipper, Transporter, Admin) |
| [use-cases.md](./use-cases.md) | Detailed use case descriptions for core workflows |

## Conventions

- **Requirement IDs** follow the pattern `FR-XXX` (functional) and `NFR-XXX` (non-functional).
- **Priority** uses MoSCoW: **Must** (required for launch), **Should** (expected but deferrable), **Could** (desirable if time permits), **Won't** (explicitly out of scope for V1).
- **User stories** follow the format: _As a [role], I want [goal], so that [benefit]._
- **Use cases** follow a structured template: actors, preconditions, main flow, alternate flows, postconditions.

## Traceability

User stories and use cases reference their corresponding functional requirement IDs (`FR-XXX`) to maintain traceability between documents.

## Document Control

These are living documents maintained under version control (Git). Changes to requirements should be reviewed and approved by the project lead before merging.
