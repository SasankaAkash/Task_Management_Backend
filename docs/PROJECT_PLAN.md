# myapp - Project Plan (NestJS API)

**Version:** 0.1 (draft)
**Date:** 2026-11-04
**Owner:** Akash
**Status:** Draft | Approved | In progress | Released

> How to use this document: replace every text in `[square brackets]`, delete the guidance lines starting with `>` once a section is filled in, and keep the change log (section 17) current. This plan is the source of truth for scope. `docs/TASK_LIST.md` tracks execution.

---

## 1. Project Overview

[Two to four sentences: what the service does, which clients consume it, and the main value it delivers.]

**One-line pitch:** myapp (NestJS application)

**API consumers:** [web app, mobile app, third parties]
**First release audience:** [who gets v1]

## 2. Problem Statement

[Describe the problem, why current solutions fall short, and what happens if it stays unsolved.]

## 3. Objectives and Success Metrics

| # | Objective | Measure of success |
|---|---|---|
| 1 | [Objective] | [Metric and target, for example "p95 latency under 300 ms"] |
| 2 | [Objective] | [Metric and target] |

## 4. Proposed Solution

[Main concepts, core flows and the core mechanism (rules engine, workflow, marketplace, content platform).]

## 5. Users, Roles and Permissions

| Role | Description | Can do | Cannot do |
|---|---|---|---|
| [Anonymous] | [Not signed in] | [Public endpoints] | [Everything else] |
| [User] | [Signed-in user] | [Manage own data] | [Access other users' data] |
| [Admin] | [Operator] | [Manage users and settings] | [-] |

> Guidance: decide single-tenant, multi-tenant or per-user ownership here. It drives the schema (owner column) and every authorization check.

## 6. Core Features

### 6.1 Authentication

- **User value:** Users can securely manage their own task data from web and mobile clients.
- **Behavior:** Supabase Auth handles email/password registration, login, refresh, logout and password recovery. A database trigger mirrors each registered Auth user into the app's `public.users` table; passwords remain in Supabase Auth. Protected API routes verify bearer tokens.
- **Endpoints:** `POST /api/v1/auth/register`, `/login`, `/refresh`, `/logout`, `/password-reset`, `/password-reset/confirm`
- **Acceptance criteria:**
  - [x] Valid credentials establish a session; invalid credentials are rejected.
  - [x] Password reset can be requested without exposing whether an email is registered, and the password can be updated with the recovery session.
- **Priority:** Must

### 6.2 Task management

- **User value:** A signed-in user can manage and find their tasks.
- **Behavior:** Create, list, retrieve, update, complete/pending and delete tasks. List queries support status filtering, title search, creation-date ordering and page/limit pagination.
- **Endpoints:** `POST /api/v1/tasks`, `GET /api/v1/tasks`, `GET /api/v1/tasks/:id`, `PATCH /api/v1/tasks/:id`, `DELETE /api/v1/tasks/:id`
- **Acceptance criteria:**
  - [x] Every task read and mutation is restricted to the authenticated owner.
  - [x] List results apply validated filters, stable creation-date ordering and pagination.
- **Priority:** Must

## 7. Domain Model

| Entity | Purpose | Key fields | Relations |
|---|---|---|---|
| `users` | Accounts | id, email, role, created_at | owns many [entity] |
| `[entity]` | [purpose] | [fields] | [relations] |

> Guidance: entity level only. Table definitions live in `src/database/schema/`. Money uses integer minor units; timestamps are UTC.

## 8. System Architecture

### 8.1 Technology stack

| Component | Technology | Responsibility |
|---|---|---|
| Framework | NestJS + TypeScript | HTTP API and modules |
| Database | PostgreSQL [provider] | Persistent data |
| Data access | Supabase Auth and PostgREST (`@supabase/supabase-js`) | Authentication and user-scoped task queries |
| Validation | Zod 4 with a Nest validation pipe | Request schemas and inferred types |
| Authentication | [JWT / sessions / provider] | Login and authorization |
| Queue / cache | [BullMQ + Redis / none in v1] | Background jobs, caching |
| API docs | OpenAPI (`@nestjs/swagger`) | Contract for clients |
| Hosting | [provider] | Deployment |
| Email / storage / payments | [provider or "not in v1"] | [responsibility] |

### 8.2 Layered architecture

```text
Client (web / mobile)
  |
  v
Global middleware -> guards -> ZodValidationPipe
  |
  v
Controllers (thin)
  |
  v
Services (business rules)  <-- pure domain engines (no framework imports)
  |
  v
Repositories --> authenticated Supabase client --> Supabase PostgreSQL
  |
  +--> integrations/* --> external APIs        jobs/* --> queues
```

Full rules: `AGENTS.md`. Contract rules: `docs/API_RULES.md`.

### 8.3 Integrations

| Integration | Purpose | Auth method | Docs link | In v1? |
|---|---|---|---|---|
| Supabase | User authentication and user-scoped task queries | Publishable key + user access token | https://supabase.com/docs | Yes |

## 9. Non-Functional Requirements

| Area | Requirement |
|---|---|
| Performance | [For example: API p95 under 500 ms] |
| Availability | [For example: 99.5% monthly] |
| Security | See section 12 |
| Scalability | [Expected users, requests per second, data volume] |
| Observability | Structured logs with request id, error tracking, uptime and readiness checks |
| Compatibility | URI-versioned API; no breaking change within a major version |

## 10. Localization (optional)

- **Localized API messages:** Yes | No
- **Default locale / other locales:** [list]
- **Currency and date formats:** [ISO 8601 UTC dates; currency codes]

## 11. Scope

### Included in Version 1

- Email/password registration, login, session refresh/logout and password recovery.
- Per-user task CRUD, completion status, filtering, title search, creation-date sorting and pagination.

### Excluded from Version 1

- [Feature deferred]

> Guidance: any request outside "Included" goes to section 16 or to the change log as an approved scope change.

## 12. Security and Privacy

- Authentication and session/token management per ADR-004.
- Authorization check on every user-owned resource in the service layer.
- Zod validation of all inputs; output shaped through DTOs.
- Secrets only in environment variables and the host secret store.
- Rate limiting, `helmet`, restricted CORS, body size limits.
- Database backups with a tested restore procedure.
- Privacy policy and data-retention rules: [describe]. Personal data stored: [list]. Deletion and export approach: [describe].

A user must never be able to read or modify another user's data.

## 13. Development Roadmap

| Phase | Main activities | Estimated duration |
|---|---|---|
| 0. Discovery | Requirements, API design, acceptance criteria | [x weeks] |
| 1. Foundation | Repo, tooling, config, database, CI, deployment | [x weeks] |
| 2. Authentication | Login, tokens/sessions, roles | [x weeks] |
| 3. Platform services | Error pipeline, pagination, logging, health, OpenAPI | [x weeks] |
| 4 to N. Feature phases | One phase per module group | [x weeks each] |
| N+1. Quality and release | Load test, security review, deployment | [x weeks] |

## 14. Testing and Quality Assurance

- Unit tests for services, DTO schemas, helpers and domain engines.
- Integration tests for repositories against a test database.
- e2e tests (Supertest) for critical flows: [sign in, core action].
- Contract check: OpenAPI generated and reviewed for each change.
- Quality gate for every PR: `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e && pnpm build`.

## 15. Deployment and Portability

- Hosting: [provider]; database: [provider]; container image built in CI.
- Environment configuration outside source code (`.env.example` documents all variables).
- Migrations run as an explicit deploy step; rollback plan: previous image plus database backup point.
- Keep business logic independent of hosting-specific services; use standard PostgreSQL features.

## 16. Risks and Future Enhancements

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [Risk] | Low / Med / High | Low / Med / High | [Mitigation] |

### Future enhancements (post v1)

- [Idea]

## 17. Open Questions and Change Log

| # | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| 1 | [Question] | [Name] | [Date] | [Pending] |

| Version | Date | Change | Approved by |
|---|---|---|---|
| 0.1 | 2026-11-04 | Initial draft | Akash |
| 0.2 | 2026-11-05 | Defined Supabase authentication and user-owned task API scope | Akash |
| 0.3 | 2026-11-05 | Added public user synchronization on Supabase Auth registration | Akash |
