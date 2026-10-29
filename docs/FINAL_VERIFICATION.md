# LabLedger — Final Verification Report

> **Generated**: 2026-10-29  
> **Branch**: `main`  
> **Last commit at time of verification**: see `git log --oneline -1`

This document records every command used to verify LabLedger's correctness, security posture, and deployment readiness at the end of Phase 10 and Phase 11.

---

## 1. Repository Health

```bash
# Check working tree is clean before verification
git status
git log --oneline -5
```

**Expected**: `nothing to commit, working tree clean`

---

## 2. Backend Unit Tests

Unit tests exercise domain rules without a database (Mockito mocks):

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
  ./mvnw test -pl . -Dtest="UserServiceTest,ReservationServiceTest" -B
```

### Verified test classes and cases

| Test Class | Cases | Covers |
|---|---|---|
| `UserServiceTest` | 7 | Registration duplicate check, BCrypt encoding, default role, login lockout, disabled account, reset on success |
| `ReservationServiceTest` | 11 | Half-open interval validation, past-start check, booking horizon, min/max duration, equipment not found, equipment under maintenance, self-approval guard, double-approve guard, cancel completed, cancel cancelled, reject approved |

---

## 3. Backend Slice Tests (`@WebMvcTest`)

Controller-layer tests verify HTTP status codes, validation, security, and CSRF:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
  ./mvnw test -pl . -Dtest="AuthControllerTest,UserControllerTest,ReservationControllerTest,\
EquipmentControllerTest,LaboratoryControllerTest,FaultReportControllerTest,\
MaintenanceWorkOrderControllerTest,NotificationControllerTest,AuditLogControllerTest,\
AnalyticsControllerTest,GlobalExceptionHandlerTest" -B
```

---

## 4. Backend Integration Tests (Testcontainers PostgreSQL 16)

Full-stack integration tests require Docker to be running:

```bash
JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home \
  ./mvnw verify -B -Dspring.profiles.active=test
```

### Integration test classes

| Test Class | Covers |
|---|---|
| `ReservationConcurrencyIntegrationTest` | Concurrent double-booking rejection, pessimistic locking |
| `MaintenanceIntegrationTest` | Fault → triage → work order → completion lifecycle |
| `NotificationAndAuditIntegrationTest` | Event → notification and audit trail consistency |
| `AnalyticsIntegrationTest` | Dashboard metric accuracy against real data |
| `CsvExportServiceTest` | CSV structure and content correctness |

---

## 5. Frontend Tests

```bash
npm test --prefix frontend -- --run --reporter=verbose
```

**Expected**: All 73 tests pass across 28 test files covering:
- Authentication flows and protected route redirects
- Form validation and error display
- Equipment inventory filters and pagination controls
- Reservation conflict submission
- Maintenance status transitions
- Notification centre (mark-read, count)
- Layout, breadcrumbs, toast, confirmation dialog components

### TypeScript type-check

```bash
npm run typecheck --prefix frontend
```

**Expected**: Zero type errors.

### Production build

```bash
npm run build --prefix frontend
```

**Expected**: Build completes successfully, `frontend/dist/` generated.

---

## 6. Security Audit

### Frontend dependency audit

```bash
npm audit --prefix frontend --audit-level=high
```

### Backend dependency analysis

```bash
./mvnw dependency:analyze -B
```

### Security configuration checklist

| Control | Implementation | Status |
|---|---|---|
| Session cookie `HttpOnly` | `server.servlet.session.cookie.http-only: true` | ✅ |
| Session cookie `Secure` | `SESSION_COOKIE_SECURE=true` (env var, required in production) | ✅ |
| Session cookie `SameSite=STRICT` | `server.servlet.session.cookie.same-site: STRICT` | ✅ |
| CSRF protection | `CookieCsrfTokenRepository.withHttpOnlyFalse()` + `X-XSRF-TOKEN` header | ✅ |
| Session fixation | `sessionFixation().migrateSession()` | ✅ |
| Password hashing | BCrypt with strength 12 | ✅ |
| Account lockout | 5 consecutive failures → 15-minute lockout | ✅ |
| RBAC | `@PreAuthorize` on service methods + `@EnableMethodSecurity` | ✅ |
| No entity leakage | All responses use Java 21 record DTOs | ✅ |
| No secrets in source | Credentials loaded from `.env` / environment variables only | ✅ |
| Flyway migrations | All schema changes via versioned Flyway scripts | ✅ |
| `ddl-auto: validate` | Set in all profiles | ✅ |
| RFC 7807 errors | `GlobalExceptionHandler` maps all exceptions to `ProblemDetail` | ✅ |
| No open-in-view | `spring.jpa.open-in-view: false` | ✅ |

---

## 7. Docker Deployment Verification

### Prerequisites

- Docker 24+ with Compose V2
- A `.env` file populated from `.env.example`

### Development stack (PostgreSQL only)

```bash
docker compose up -d
docker compose ps
docker compose logs postgres
```

### Production stack (full application)

```bash
# 1. Populate secrets
cp .env.example .env
# Edit .env with real values

# 2. Build images
docker compose -f docker-compose.prod.yml build

# 3. Start the stack
docker compose -f docker-compose.prod.yml up -d

# 4. Verify all services are healthy
docker compose -f docker-compose.prod.yml ps

# Expected output (all services "healthy"):
#   labledger-postgres-prod   running (healthy)
#   labledger-backend-prod    running (healthy)
#   labledger-frontend-prod   running (healthy)

# 5. Verify backend liveness
curl -s http://localhost:80/actuator/health | python3 -m json.tool

# Expected: {"status":"UP","components":{"db":{"status":"UP"},...}}

# 6. Access the application
open http://localhost:80
```

### Database lifecycle

```bash
# List volumes
docker volume ls | grep labledger

# Backup the production database
docker exec labledger-postgres-prod \
  pg_dump -U "$DB_USER" "$DB_NAME" | gzip > labledger-backup-$(date +%Y%m%d).sql.gz

# Restore from backup
gunzip -c labledger-backup-YYYYMMDD.sql.gz | \
  docker exec -i labledger-postgres-prod psql -U "$DB_USER" "$DB_NAME"

# Check Flyway migration status (application startup logs show this automatically)
# Or query the schema history table:
docker exec labledger-postgres-prod \
  psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT version, description, installed_on, success FROM flyway_schema_history ORDER BY installed_rank;"
```

---

## 8. CI Pipeline Verification

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on every push and pull request to `main` and `develop`.

Pipeline jobs:
1. **backend** — JDK 21, Maven verify (unit + integration tests), JAR build
2. **frontend** — Node 20, TypeScript check, Vitest tests, Vite production build
3. **security-audit** — `npm audit` (high severity) + `dependency:analyze`

Badge: ![CI Pipeline](https://github.com/Rohan23Nova/Lab-Equipment-Maintenance-Platform/actions/workflows/ci.yml/badge.svg)

---

## 9. Known Limitations and Deferred Items

| Item | Details |
|---|---|
| Email SMTP | `EmailNotificationService` logs emails to console in dev; SMTP is configured via `MAIL_*` environment variables for production. |
| Test profile Testcontainers | Integration tests pull the `postgres:16` Docker image on first run. Requires Docker daemon. Unit tests and slice tests run without Docker. |
| Actuator exposure | `/actuator/health`, `/actuator/info`, `/actuator/metrics` are public. In production, restrict actuator access to an internal network or authenticated endpoint. |

---

## 10. Final Commit Log

```bash
git log --oneline -5
```
