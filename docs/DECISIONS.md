# LabLedger Architecture Decision Records (ADRs)

This document records key architectural, technological, and engineering decisions made for the LabLedger platform, following the MADR (Markdown Architectural Decision Records) format.

---

## Index of Decisions
- [ADR-001: Modular Monolith Architecture](#adr-001-modular-monolith-architecture)
- [ADR-002: Server-Side Sessions with CSRF Protection vs Stateless JWT](#adr-002-server-side-sessions-with-csrf-protection-vs-stateless-jwt)
- [ADR-003: Half-Open Interval Representation `[start, end)` and Concurrency Locking](#adr-003-half-open-interval-representation-start-end-and-concurrency-locking)
- [ADR-004: Flyway Database Schema Migrations over Hibernate ddl-auto](#adr-004-flyway-database-schema-migrations-over-hibernate-ddl-auto)
- [ADR-005: Java 21 Records for Immutable DTOs and Layer Decoupling](#adr-005-java-21-records-for-immutable-dtos-and-layer-decoupling)
- [ADR-006: PostgreSQL and Testcontainers for Testing Fidelity](#adr-006-postgresql-and-testcontainers-for-testing-fidelity)
- [ADR-007: React, TypeScript, Vite, Tailwind CSS, and shadcn/ui for Frontend](#adr-007-react-typescript-vite-tailwind-css-and-shadcnui-for-frontend)

---

## ADR-001: Modular Monolith Architecture

### Context
LabLedger requires clear domain boundaries across authentication, inventory, reservations, maintenance, notifications, auditing, and analytics. We needed to choose between a microservices topology and a monolithic structure.

### Decision
We will build LabLedger as a **Modular Monolith** within a single Spring Boot application running on Java 21. Modules reside in dedicated packages (`com.labledger.modules.*`), communicate across boundaries via explicit service interfaces or Spring `ApplicationEvent`s, and do not execute cross-module database joins.

### Status
Accepted

### Consequences
- **Positive**:
  - Simplified continuous deployment and zero distributed systems overhead (no network latency between services, no distributed tracing complexity, no two-phase commits).
  - Strong transactional guarantees (ACID) across critical operations like equipment reservation and audit logging.
  - Clear domain boundaries make future microservice extraction straightforward if university scale warrants it.
- **Negative**:
  - Requires developer discipline to avoid breaking module boundaries (e.g., cross-module entity sharing or circular service dependencies). Enforced via code reviews and package-private access rules.

---

## ADR-002: Server-Side Sessions with CSRF Protection vs Stateless JWT

### Context
Single Page Applications (SPAs) often default to stateless JWTs stored in browser `localStorage`. However, JWTs in `localStorage` cannot be immediately revoked upon security events (e.g., student account suspension, role change) and are vulnerable to exfiltration via Cross-Site Scripting (XSS).

### Decision
We will use **Spring Security stateful server-side sessions** identified by an `HttpOnly`, `Secure`, `SameSite=Strict` `JSESSIONID` cookie, accompanied by **Spring Security CSRF protection** (`CookieCsrfTokenRepository.withHttpOnlyFalse()` sending `XSRF-TOKEN` and validating incoming `X-XSRF-TOKEN` request headers).

### Status
Accepted

### Consequences
- **Positive**:
  - Immediate session invalidation on logout or administrative revocation.
  - Immune to XSS credential extraction due to `HttpOnly` flag.
  - Robust protection against CSRF across all mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Negative**:
  - Server maintains session state in memory (or Redis in horizontally scaled clusters).
  - Requires the SPA client to execute a pre-flight CSRF handshake on startup and forward the `X-XSRF-TOKEN` header on mutations.

---

## ADR-003: Half-Open Interval Representation `[start, end)` and Concurrency Locking

### Context
Booking equipment requires preventing schedule collisions. Closed intervals $[start, end]$ create boundary ambiguity (e.g., whether a reservation ending at 14:00 allows another to start at 14:00). Furthermore, concurrent reservation requests can create double-bookings if not locked at both the application and database tiers.

### Decision
1. All reservation intervals will be modeled and validated as **half-open intervals**: $[start\_time, end\_time)$, where `start_time` is inclusive and `end_time` is exclusive.
2. In the application layer, `ReservationService` acquires a pessimistic write lock (`@Lock(LockModeType.PESSIMISTIC_WRITE)`) on the target `EquipmentItem`.
3. In PostgreSQL, a `btree_gist` **exclusion constraint** is enforced on `tstzrange(start_time, end_time, '[)')` for active bookings, ensuring the database engine rejects any race condition with an immediate integrity error.

### Status
Accepted

### Consequences
- **Positive**:
  - Mathematical precision: adjacent slots $[10:00, 11:00)$ and $[11:00, 12:00)$ do not collide.
  - Zero possibility of double-booking, even under heavy multi-threaded or multi-instance race conditions.
- **Negative**:
  - Requires enabling the PostgreSQL `btree_gist` extension in the initial migration script.
  - Repository tests must run against real PostgreSQL (Testcontainers) rather than H2, which lacks GiST exclusion constraint syntax.

---

## ADR-004: Flyway Database Schema Migrations over Hibernate ddl-auto

### Context
Hibernate's `hbm2ddl.auto` (e.g. `update` or `create-drop`) can alter or drop database tables unpredictably, lacks historical auditability, cannot handle non-standard SQL (such as GiST exclusion constraints or JSONB indexes), and is unsuitable for production deployments.

### Decision
We mandate **Flyway** for all database schema migrations. Migration scripts are versioned sequentially under `src/main/resources/db/migration/V{N}__{description}.sql`. In all environments (including test and production), Hibernate is configured with `ddl-auto: validate`.

### Status
Accepted

### Consequences
- **Positive**:
  - 100% reproducible, auditable database schema across all developer machines, CI, and staging environments.
  - Enables advanced PostgreSQL features (`btree_gist`, custom indexes, generated columns, triggers).
  - Eliminates silent schema drift.
- **Negative**:
  - Schema changes require authoring explicit SQL migration scripts alongside entity modifications.

---

## ADR-005: Java 21 Records for Immutable DTOs and Layer Decoupling

### Context
Exposing JPA entities directly in web controllers leads to accidental lazy-loading exceptions (`LazyInitializationException`), infinite JSON serialization loops in bidirectional relationships, and unintended exposure of internal database columns (e.g. `password_hash`).

### Decision
We will use **Java 21 `record`s** for all Request and Response Data Transfer Objects (DTOs). Controllers must never accept or return `@Entity` objects. Explicit mappers or factory methods translate between DTO records and domain entities.

### Status
Accepted

### Consequences
- **Positive**:
  - Immutable, thread-safe data carriers with built-in value semantics (`equals`, `hashCode`, `toString`).
  - Strict decoupling of internal persistence structures from public API contracts.
  - Easy integration with Jakarta Bean Validation annotations.
- **Negative**:
  - Requires boilerplate mapping code, mitigated by concise mapper methods or MapStruct.

---

## ADR-006: PostgreSQL and Testcontainers for Testing Fidelity

### Context
In-memory H2 databases behave differently than PostgreSQL regarding dialect, data types (`TIMESTAMPTZ`, `JSONB`, `UUID`), case sensitivity, and specialized constraints (like `btree_gist` exclusion constraints). Using H2 creates false positives in CI and hides real production failures.

### Decision
All database-dependent automated tests (repository slice tests and Spring Boot integration tests) will execute against **real PostgreSQL instances managed dynamically via Testcontainers**.

### Status
Accepted

### Consequences
- **Positive**:
  - Complete fidelity with production: exclusion constraints, JSONB operations, and timestamp conversions are tested accurately.
  - Catches database-specific query syntax bugs before code reaches staging.
- **Negative**:
  - Requires a local Docker runtime during test execution.
  - Marginally slower test startup compared to in-memory H2 (mitigated by Testcontainers container reuse).

---

## ADR-007: React, TypeScript, Vite, Tailwind CSS, and shadcn/ui for Frontend

### Context
The frontend needs to be responsive, accessible (WCAG compliant), robust, and productive for laboratory workflows (equipment reservation calendars, maintenance dashboards, triage panels).

### Decision
We select:
- **Vite**: Rapid hot module replacement and optimized production bundling.
- **React 18 + TypeScript**: Strong typing shared with or mirroring backend DTO contracts.
- **Tailwind CSS**: Utility-first styling with zero CSS bloat.
- **shadcn/ui (Radix UI primitives)**: Accessible, unstyled, composable UI components that can be customized directly in the codebase.
- **Lucide React**: Clean, accessible icon set.
- **TanStack Query (React Query) v5**: Server-state synchronization, query caching, and optimistic UI updates.

### Status
Accepted

### Consequences
- **Positive**:
  - Excellent developer experience with instant feedback loops.
  - Built-in accessibility (ARIA keyboard navigation, screen reader support) via Radix primitives.
  - High performance, small bundle size, and consistent visual aesthetic across complex dashboard screens.
- **Negative**:
  - Team must follow conventions for component encapsulation and avoid sprawling untyped state.
