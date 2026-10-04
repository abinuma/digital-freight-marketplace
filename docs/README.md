# Documentation Index

**Project:** Digital Freight Marketplace

This directory contains all project documentation organized by domain.

## Documents

| Document | Path | Description |
|----------|------|-------------|
| Product Overview | [product-overview.md](./product-overview.md) | Project vision, objectives, target users, and tech stack |
| Implementation Plan | [plan.md](./plan.md) | Phased development roadmap |

## Directories

| Directory | Contents |
|-----------|----------|
| [requirements/](./requirements/) | SRS, functional & non-functional requirements, user stories, use cases |
| [architecture/](./architecture/) | System architecture and design decisions |

## Directory Structure

```
docs/
├── README.md                       ← You are here
├── product-overview.md             ← Vision, scope, and tech stack
├── plan.md                         ← Implementation roadmap
├── architecture/
│   ├── README.md                   ← Architecture index
│   ├── architecture.md             ← System architecture & module design
│   ├── database.md                 ← Schema, entities, indexing, migrations
│   ├── api.md                      ← Endpoint catalog, conventions, versioning
│   ├── security.md                 ← Auth, RBAC, threat mitigations
│   └── deployment.md               ← Environments, CI/CD, Docker, monitoring
└── requirements/
    ├── README.md                   ← Requirements index
    ├── srs.md                      ← Software Requirements Specification
    ├── functional-requirements.md  ← All functional requirements (FR-XXX)
    ├── non-functional-requirements.md ← Quality attributes (NFR-XXX)
    ├── user-stories.md             ← User stories by role
    └── use-cases.md                ← Core workflow use cases
```
