# AGENTS.md: Persistent Engineering Guidelines for LabLedger

This document defines the permanent engineering invariants, coding standards, and operational guidelines for all AI agents and developers implementing features across all phases of the **LabLedger** platform.

Every agent working on this codebase **MUST** read, understand, and adhere to these directives.

---

## 1. Core Architectural Invariants

1. **Modular Monolith Integrity**:
   - Keep domain modules decoupled under `com.labledger.modules.{module_name}`.
   - Do **NOT** perform cross-module repository joins or queries. If module A needs data from module B, communicate via explicit Service interfaces or publish asynchronous Spring domain events (`ApplicationEventPublisher`).
   - Circular dependencies between modules are strictly forbidden.
2. **Strict Layering of Concerns**:
   - `Controller -> Service -> Repository -> Entity`
   - **Controllers**: Strictly responsible for HTTP mapping, input validation triggers (`@Valid`), security context passing, and returning `ResponseEntity<T>`. **Controllers MUST NOT contain business logic.**
   - **Services**: Encapsulate all business rules, authorization decisions, event publishing, and database transaction boundaries (`@Transactional`).
   - **Repositories**: Encapsulate Spring Data queries, database locking (`@Lock`), and persistence interactions.
   - **Entities**: Encapsulate JPA state and database mapping.
3. **Zero JPA Entity Leakage**:
   - **NEVER** accept JPA `@Entity` classes as controller `@RequestBody` parameters.
   - **NEVER** return JPA `@Entity` classes directly in API responses.
   - Always map entities to and from immutable **Java 21 `record` DTOs** before crossing the controller boundary.
4. **Database Migrations First**:
   - All schema changes must be delivered via versioned **Flyway scripts** in `src/main/resources/db/migration/`.
   - Never rely on Hibernate schema auto-generation. In all environments, `spring.jpa.hibernate.ddl-auto` must be set to `validate`.
   - Never modify a migration script that has already been committed or applied. Create a new sequential migration version (e.g., `V7__...`).

---

## 2. Coding Standards & Best Practices

1. **Java & Spring Conventions**:
   - Use **Java 21 LTS** language features (records, pattern matching, sealed interfaces where appropriate).
   - **Constructor Injection Only**: Always inject dependencies via constructors (e.g., Lombok `@RequiredArgsConstructor` with `private final` fields). Field injection (`@Autowired` on fields) is strictly prohibited.
   - Keep methods small, cohesive, and clearly named.
   - Use meaningful variable and method names that convey business intent (e.g., `reserveEquipmentSlot` instead of `doBooking` or `processData`).
2. **Temporal & Timezone Handling**:
   - Store all timestamps in UTC using PostgreSQL `TIMESTAMPTZ` and Java `java.time.Instant` or `java.time.OffsetDateTime` (UTC).
   - Perform all business comparisons, interval calculations, and duration checks strictly in UTC.
   - Frontend React components parse the UTC ISO-8601 string and display times formatted in the user's local timezone.
3. **Reservation Intervals**:
   - Model all reservation periods as **half-open intervals**: $[start\_time, end\_time)$.
   - The start time is inclusive; the end time is exclusive. Adjacent slots $[10:00, 11:00)$ and $[11:00, 12:00)$ must never collide.
   - Always validate that `startTime < endTime`.
   - Protect reservations from double-booking using both service-level pessimistic locks (`findByIdWithLock`) and PostgreSQL `btree_gist` exclusion constraints.
4. **Monetary Precision**:
   - Always use `java.math.BigDecimal` for monetary values (costs, fees, prices).
   - In PostgreSQL, use `NUMERIC(12, 2)`.
   - Never use `float` or `double` for currency calculations.
5. **Transactions**:
   - Annotate service classes with `@Transactional(readOnly = true)`.
   - Explicitly annotate mutating service methods with `@Transactional`.
   - Keep transaction scopes as narrow as possible. Do not execute external HTTP calls or heavy file operations inside a database transaction.

---

## 3. Error Handling & API Conventions

1. **RFC 7807 Problem Details**:
   - All API error responses must adhere to the RFC 7807 (`ProblemDetail`) format with appropriate HTTP status codes:
     - `400 Bad Request`: Validation failures with field-level breakdowns.
     - `401 Unauthorized`: Missing or invalid session.
     - `403 Forbidden`: Authenticated user lacks required role or ownership.
     - `404 Not Found`: Target entity ID does not exist.
     - `409 Conflict`: Schedule collision or state transition conflict.
     - `500 Internal Server Error`: Unhandled server exceptions (sanitized, zero stack traces exposed).
2. **Input Validation**:
   - Enforce Jakarta Bean Validation annotations (`@NotNull`, `@NotBlank`, `@Size`, `@Min`, `@Max`, `@Future`) on all Request DTOs.
   - Apply custom validators (such as `@ValidTimeInterval`) to validate cross-field business constraints.
3. **No Fake Implementations**:
   - Do **NOT** create mock/dummy backend endpoints that return static placeholders or pretend to perform work.
   - Do **NOT** create UI buttons or forms that pretend to save data or trigger actions without a real backend implementation.

---

## 4. Security Invariants

1. **Authentication & Sessions**:
   - Use Spring Security stateful server-side sessions (`JSESSIONID`).
   - Session cookies must carry: `HttpOnly = true`, `Secure = true` (in production/HTTPS), and `SameSite = STRICT`.
2. **CSRF Protection**:
   - CSRF protection is mandatory for all mutating HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
   - Use `CookieCsrfTokenRepository.withHttpOnlyFalse()` sending `XSRF-TOKEN` cookie, and ensure client sends the `X-XSRF-TOKEN` header.
3. **Role-Based Access Control**:
   - Protect service methods and controller endpoints with `@PreAuthorize("hasRole('...')")`.
   - Roles: `ROLE_STUDENT`, `ROLE_FACULTY`, `ROLE_LAB_MANAGER`, `ROLE_ADMIN`.
4. **Secrets & Configurations**:
   - **NEVER** commit passwords, API tokens, database credentials, or secret keys to the Git repository.
   - Always load sensitive credentials from environment variables via `.env`.
   - Ensure `.env.example` remains updated with mock/safe templates for all required keys.

---

## 5. Testing Discipline

1. **Test Real Behavior**:
   - Unit tests: JUnit 5, AssertJ, Mockito. Test domain logic, calculations, and validators in isolation.
   - Slice tests: `@WebMvcTest` for controllers, verifying status codes, validation, CSRF, and security filters.
   - Repository & Database tests: Use **Testcontainers PostgreSQL 16**. **Never use H2 database for repository tests.**
   - Frontend tests: Vitest + React Testing Library + Mock Service Worker (MSW).
2. **Verification Before Completion**:
   - Before completing any phase or feature, run the full test suite (`./mvnw verify` and `npm test`).
   - Ensure all tests pass with zero warnings, zero regressions, and clean logs.

---

## 6. Git & Commit Guidelines

1. **Atomic Commits**:
   - Commit only the files relevant to the active phase or task.
   - Do not stage scratch files, IDE settings, or build artifacts (`target/`, `node_modules/`, `.DS_Store`).
2. **Conventional Commit Messages**:
   - Format: `<type>(<scope>): <short description>`
   - Examples:
     - `chore: establish LabLedger project foundation`
     - `feat(auth): implement user registration and session login`
     - `feat(reservation): add exclusion constraint and conflict validation`
     - `test(equipment): add integration tests for status transitions`
3. **Truthful Reporting**:
   - Always inspect `git status` and `git branch` before committing.
   - Always report the exact commit SHA and push status truthfully to the user.
   - Never perform force pushes (`git push --force`).
