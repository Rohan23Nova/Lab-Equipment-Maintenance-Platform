# LabLedger: University Laboratory Equipment Reservation & Lifecycle Maintenance Platform

[![CI Pipeline](https://github.com/Rohan23Nova/Lab-Equipment-Maintenance-Platform/actions/workflows/ci.yml/badge.svg)](https://github.com/Rohan23Nova/Lab-Equipment-Maintenance-Platform)
[![Java 21](https://img.shields.io/badge/Java-21-orange.svg)](https://adoptium.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.x-green.svg)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.x-38bdf8.svg)](https://tailwindcss.com/)

**LabLedger** is a production-minded academic laboratory equipment reservation, scheduling, and lifecycle maintenance platform. Built as an Advanced Java course project, it addresses operational challenges in university research facilities: fragmented reservation spreadsheets, schedule double-bookings, unmonitored instrument wear-and-tear, uncoordinated maintenance downtime, and audit compliance deficiencies.

---

## 1. Product Capabilities & User Personas

| Persona | Core Capabilities |
|---|---|
| **Students & Researchers (`ROLE_STUDENT`)** | Browse lab catalog, inspect instrument specifications, book equipment time slots, complete check-in/out during usage, view qualification certifications, submit fault reports. |
| **Faculty & PIs (`ROLE_FACULTY`)** | Sponsoring student research bookings, reserving specialized laboratory bays, tracking project equipment usage, and reviewing departmental equipment utilization. |
| **Lab Managers (`ROLE_LAB_MANAGER`)** | Managing equipment inventory, reviewing and approving restricted equipment bookings, triaging user fault reports, assigning maintenance work orders to technicians, logging replacement spare parts, and tracking instrument downtime. |
| **System Administrators (`ROLE_ADMIN`)** | Platform-wide user management, role assignments, laboratory facility setup, system configuration, and compliance audit log inspection. |

---

## 2. Technology Stack & Pinned Specifications

### Backend
- **Language**: Java 21 LTS (Amazon Corretto / Eclipse Temurin)
- **Framework**: Spring Boot 3.5.x
- **Build Tool**: Apache Maven 3.9+ with Maven Wrapper (`mvnw`)
- **Persistence**: Spring Data JPA & Hibernate 6.x
- **Database Migrations**: Flyway (`flyway-core`, `flyway-database-postgresql`)
- **Security**: Spring Security 6.x
  - Stateful server-side sessions with `JSESSIONID` (`HttpOnly`, `Secure`, `SameSite=Strict`)
  - Cross-Site Request Forgery (CSRF) protection with `X-XSRF-TOKEN` header validation
  - Method-level security (`@PreAuthorize`) and Role-Based Access Control (RBAC)
- **Validation**: Jakarta Bean Validation (`spring-boot-starter-validation`)
- **API Documentation**: OpenAPI 3 / Swagger UI (`springdoc-openapi-starter-webmvc-ui`)
- **Testing**: JUnit 5, AssertJ, Mockito, Spring MVC Test (`@WebMvcTest`), and Testcontainers PostgreSQL 16

### Frontend
- **Framework**: React 18 (TypeScript)
- **Build Tool / Bundler**: Vite 6.x
- **Styling**: Tailwind CSS 3.4.x
- **UI Primitives**: shadcn/ui (Radix UI accessible primitives)
- **Icons**: Lucide React
- **Server State & Caching**: TanStack Query (React Query) v5
- **HTTP Client**: Axios with credentials and automatic CSRF interceptors
- **Testing**: Vitest, React Testing Library, jsdom, Mock Service Worker (MSW)

### Infrastructure & Persistence
- **Database**: PostgreSQL 16 Alpine
- **Database Extensions**: `uuid-ossp`, `btree_gist` (for GiST temporal range exclusion constraints)
- **Local Dev Orchestration**: Docker Compose v2
- **Continuous Integration**: GitHub Actions

---

## 3. Architecture & Modular Boundaries

LabLedger is architected as a **modular monolith** with clean boundary encapsulation, strong transactional consistency, and zero cross-module database joins:

```mermaid
graph TD
    UI["Frontend SPA (React 18 / TypeScript / Vite / shadcn/ui)"]
    SEC["Spring Security Filter Chain (Sessions + CSRF)"]
    UI -->|HTTPS REST with Session Cookie| SEC

    subgraph Backend ["LabLedger Modular Monolith (Spring Boot 3.5.x / Java 21)"]
        AUTH["auth: Authentication & User Management"]
        EQUIP["equipment: Laboratories & Equipment Inventory"]
        RES["reservation: Scheduling, Conflict Resolution & Check-in"]
        MAINT["maintenance: Fault Reports, Work Orders & Spare Parts"]
        NOTIF["notification: In-App Alerts & Email Notifications"]
        AUDIT["audit: Append-Only Compliance & Event Logging"]
        ANALYTICS["analytics: Utilization Rates, MTBF/MTTR & Reports"]

        SEC --> AUTH
        SEC --> EQUIP
        SEC --> RES
        SEC --> MAINT
        SEC --> NOTIF
        SEC --> AUDIT
        SEC --> ANALYTICS

        RES -.-> EQUIP
        MAINT -.-> EQUIP
        RES -->|Domain Event| NOTIF
        MAINT -->|Domain Event| NOTIF
        RES -->|Domain Event| AUDIT
        MAINT -->|Domain Event| AUDIT
    end

    subgraph Storage ["PostgreSQL 16 Engine"]
        FLYWAY["Flyway Migrations"]
        TABLES[("Normalized Relational Tables")]
        GIST["btree_gist Overlap Exclusion Constraint"]
        FLYWAY --> TABLES
        TABLES --- GIST
    end

    Backend --> Storage
```

### Architectural Highlights
- **Strict Layering**: Controller -> Service -> Repository -> Entity. Controllers never execute domain logic.
- **Immutable DTO Boundaries**: All external API contracts use **Java 21 `record`s**. JPA entities are never exposed in API responses.
- **Half-Open Intervals**: All reservation intervals are modeled as $[start, end)$. Adjacent bookings $[10:00, 11:00)$ and $[11:00, 12:00)$ do not collide.
- **Double-Booking Defense**: Pessimistic locking at service layer combined with PostgreSQL `btree_gist` exclusion constraints at the storage engine level.
- **Timezone Discipline**: All timestamps stored strictly in UTC (`TIMESTAMPTZ` / `java.time.Instant`) and formatted to the user's local timezone in the React UI.
- **Monetary Integrity**: Financial figures (repair costs, spare parts, equipment value) use `NUMERIC(12, 2)` and Java `BigDecimal`.

---

## 4. Repository Structure

```
.
├── .editorconfig                # Global code formatting standards
├── .env.example                 # Environment variable template (safe defaults)
├── .gitignore                   # Multi-language Git ignore rules
├── AGENTS.md                    # Persistent instructions and invariants for AI agents
├── README.md                    # Project overview and technical handbook
├── docs/                        # Architectural blueprints and engineering guides
│   ├── ARCHITECTURE.md          # Modular monolith design, packages, concurrency
│   ├── DATA_MODEL.md            # ER diagram, schema specs, Flyway roadmap
│   ├── DECISIONS.md             # Architecture Decision Records (ADR-001 - ADR-007)
│   ├── IMPLEMENTATION_PLAN.md   # Phased delivery roadmap (Phase 00 - Phase 06)
│   ├── SECURITY.md              # Session security, CSRF, RBAC matrix, password policy
│   └── TESTING_STRATEGY.md      # Testing pyramid, Testcontainers, Vitest, quality gates
├── pom.xml                      # Root Maven build descriptor (Phase 01)
├── docker-compose.yml           # Local PostgreSQL infrastructure (Phase 01)
├── src/                         # Spring Boot backend source code (Phase 01+)
└── frontend/                    # React / Vite single-page application (Phase 01+)
```

---

## 5. Implementation Roadmap

- [x] **Phase 00: Project Foundation** — Architecture blueprints, data model specifications, security model, testing strategy, ADRs, code formatting, and Git baseline.
- [x] **Phase 01: Visual Identity & Landing Page** — Design tokens, brand marks, accessible UI primitives, responsive public landing page, interactive product preview console, and persistent light/dark themes.
- [x] **Phase 02: Core Backend Foundation & Database Integration** — Maven setup, Spring Boot 3.4.3 on Java 21, PostgreSQL integration, Flyway migrations, RFC 7807 problem details, health endpoints, and centralized frontend API client.
- [x] **Phase 03: Authentication & Role-Based Authorization** — Spring Security 6 stateful sessions, CSRF (`X-XSRF-TOKEN`), BCrypt password encoding, account lockout, `@PreAuthorize` RBAC, roles: `STUDENT / FACULTY / LAB_ASSISTANT / TECHNICIAN / ADMIN`.
- [x] **Phase 04: Equipment Inventory & Laboratory Management** — Laboratory and equipment entities, Flyway V3 migration, lifecycle enums (`AVAILABLE → IN_USE → UNDER_MAINTENANCE → ARCHIVED`), category management, search, pagination, sorting, and filters.
- [x] **Phase 05: Equipment Reservation Engine** — Half-open interval `[start, end)` scheduling, GiST exclusion constraint, pessimistic locks, approval workflows (`PENDING → APPROVED / REJECTED → COMPLETED`), configurable booking policies.
- [x] **Phase 06: Fault Reports & Maintenance Work Orders** — Fault lifecycle (`OPEN → TRIAGED → IN_REPAIR → RESOLVED → CLOSED`), work order lifecycle (`CREATED → ASSIGNED → IN_PROGRESS → COMPLETED`), repair notes, technician assignment.
- [x] **Phase 07: Notifications & Audit History** — In-app notification centre, unread count, mark-read / mark-all-read, upcoming reservation reminders scheduler, append-only `AuditLog` for all significant state transitions.
- [x] **Phase 08: Operational Dashboard & Analytics** — Role-aware dashboard metrics (utilization, fault rate, pending approvals, overdue work orders), CSV export, and utilization reporting.
- [x] **Phase 09: Full-Application UX Integration & Design Polish** — Collapsible sidebar, breadcrumbs, toast notifications, confirmation dialogs, responsive mobile layout, dark/light theme parity, code-split lazy-loaded routes.
- [x] **Phase 10: System-Wide Testing & Security Hardening** — `UserServiceTest` (7 cases), `ReservationServiceTest` (11 cases), 16 controller slice tests, 5 integration test classes, GitHub Actions CI (backend + frontend + security audit).
- [x] **Phase 11: Deployment & Final Project Delivery** — Multi-stage Dockerfiles (JRE + nginx), `docker-compose.prod.yml`, `.env.example`, health checks, non-root users, network isolation, `docs/FINAL_VERIFICATION.md`.

---

## 6. Quick Start

### Development (local)

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Start the backend (requires Java 21)
cp .env.example .env   # edit DB credentials if needed
./mvnw spring-boot:run

# 3. Start the frontend (requires Node 20)
npm install --prefix frontend
npm run dev --prefix frontend
```

Open [http://localhost:5173](http://localhost:5173).

### Production (Docker Compose)

```bash
cp .env.example .env  # fill in all required values
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

Open [http://localhost:80](http://localhost:80). See [`docs/FINAL_VERIFICATION.md`](docs/FINAL_VERIFICATION.md) for the full verification checklist.

---

## 7. Engineering Standards

- **Constructor Injection**: All Spring components use constructor injection (`@RequiredArgsConstructor`). Field injection is forbidden.
- **Fail Fast with Structured Errors**: All errors return RFC 7807 `ProblemDetail` with field-level breakdowns.
- **Zero Secrets in Repository**: All credentials are externalized via `.env`.
- **Database Migrations First**: All schema changes via Flyway scripts. Hibernate `ddl-auto: validate` in all profiles.

---

## 8. Documentation Index

For detailed specifications, consult the documents in the [`docs/`](docs/) directory:
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [Data Model & Schema](docs/DATA_MODEL.md)
- [Security & Access Control](docs/SECURITY.md)
- [Testing Strategy](docs/TESTING_STRATEGY.md)
- [Architecture Decision Records](docs/DECISIONS.md)
- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Final Verification Report](docs/FINAL_VERIFICATION.md)
- [Agent Operational Guidelines](AGENTS.md)
