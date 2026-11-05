# Architecture Decision Records (ADR)

Log of technical decisions for **myapp** (NestJS). Add a new entry whenever you choose, change or reject a stack component, architectural pattern, vendor or convention. Never rewrite history: if a decision changes, add a new ADR that supersedes the old one and update the old status.

## How to add an entry

Copy the template at the bottom, use the next number, and set the status. Link the ADR from the PR that implements it.

**Statuses:** Proposed, Accepted, Superseded by ADR-XXX, Rejected.

---

## ADR-001: Baseline stack

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** The backend needs a consistent, maintainable foundation that one developer or a small team can own and that serves web and mobile clients.
- **Decision:** NestJS with TypeScript strict, Zod (`nestjs-zod`), Drizzle ORM on PostgreSQL, `@nestjs/config`, `nestjs-pino`, `@nestjs/swagger`, Jest and Supertest, managed with pnpm.
- **Consequences:** Single language with the web client; schemas can be shared; standard PostgreSQL keeps hosting portable. Requires discipline on module boundaries (see `AGENTS.md`).
- **Alternatives considered:** Express/Fastify without a framework (less structure); Prisma or TypeORM (heavier runtime or less SQL transparency); `class-validator` DTOs (duplicate type definitions next to Zod).

## ADR-002: Module-per-feature, layered architecture

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** Business logic mixed into controllers becomes untestable and duplicated.
- **Decision:** Enforce `Controller -> Service -> Repository -> DB`, with pure domain engines in `domain/` and cross-module access only through exported providers or events.
- **Consequences:** More files, each small and testable. Domain engines can be tested without a database or Nest.

## ADR-003: Global validation, error and response pipeline

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** Per-controller validation and error handling produce inconsistent contracts.
- **Decision:** Global `ZodValidationPipe`, `AllExceptionsFilter`, `ResponseInterceptor`, and private-by-default guards; `AppError` is the only error type thrown by features.
- **Consequences:** One response and error shape for all clients (see `docs/API_RULES.md`).

## ADR-004: Authentication approach

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** The API serves browser and mobile clients and needs registration, password login, password recovery, revocable sessions and authenticated access to user-owned tasks.
- **Decision:** Use Supabase Auth email/password flows through `@supabase/supabase-js`. Clients send Supabase access tokens as bearer credentials; refresh tokens are rotated through the refresh endpoint and accepted by logout for session revocation.
- **Consequences:** Supabase owns password hashing, email recovery and token lifecycle. The API validates access tokens with Supabase for protected requests and does not store passwords or session state. Email confirmation and password-reset redirect URLs must be configured in Supabase.
- **Alternatives considered:** Custom password/JWT storage would duplicate Supabase Auth and increase credential-handling risk; cookie sessions are not the shared browser/mobile contract.

## ADR-005: Hosting, database and queue provider

- **Status:** Proposed
- **Date:** 2026-11-04
- **Context:** [Budget, region, scale, team skills.]
- **Decision:** [For example: containerized on provider X + managed PostgreSQL + Redis for queues.]
- **Consequences:** [Vendor lock-in risks and portability measures from `PROJECT_PLAN.md` section 15.]

## ADR-006: Tenancy and data ownership

- **Status:** Accepted
- **Date:** 2026-11-04
- **Context:** Tasks are private to the account that created them; the client must not choose ownership.
- **Decision:** Per-user ownership. Every task query filters by the authenticated Supabase user ID, and writes set `user_id` from that verified identity.
- **Consequences:** User scoping is enforced in the repository as well as by Supabase Row Level Security policies. Policies on `tasks` must restrict select, insert, update and delete to `auth.uid() = user_id`.

## ADR-007: Supabase task queries

- **Status:** Accepted
- **Date:** 2026-11-05
- **Context:** The task API requirements explicitly call for Supabase filtering, search, ordering and pagination, while the repository already integrates with Supabase.
- **Decision:** Use the authenticated Supabase client and PostgREST for task repository queries rather than introducing a separate database client for this feature.
- **Consequences:** The repository explicitly scopes every operation to `user_id`, and passes the request's access token to Supabase so database RLS is evaluated as the authenticated user. Supabase remains responsible for task schema and RLS deployment. Zod schemas use a small local Nest pipe because `nestjs-zod` does not declare support for the project's NestJS 12 version.
- **Alternatives considered:** Prisma/Drizzle access would not fulfill the requested Supabase query behavior; service-role queries would bypass user RLS and are not used.

## ADR-008: Supabase user profile synchronization

- **Status:** Accepted
- **Date:** 2026-11-05
- **Context:** Tasks reference a public user row, but Supabase Auth creates identities in `auth.users` and does not automatically create application rows.
- **Decision:** Rename the application table from `profiles` to `users` and use a database trigger on `auth.users` inserts to create the matching public row. Supabase Auth remains the sole owner of passwords and credentials.
- **Consequences:** Registration creates the user row atomically with the Auth identity, avoiding a separate API write and partial-registration state. Existing Auth users are backfilled during migration. Row Level Security limits public user reads to the matching authenticated identity.
- **Alternatives considered:** Storing passwords in `public.users` duplicates credential storage and bypasses Supabase Auth; creating the row in a second API call can leave a registered identity without the task-owner row.

---

## Template

```markdown
## ADR-XXX: Title

- **Status:** Proposed | Accepted | Superseded by ADR-XXX | Rejected
- **Date:** 2026-11-04
- **Context:** What problem or constraint forces a decision?
- **Decision:** What was chosen, stated plainly.
- **Consequences:** Benefits, costs, risks, follow-up work.
- **Alternatives considered:** Options rejected and why.
```
