# LabLedger Testing Strategy & Quality Assurance Framework

## 1. Testing Philosophy & Test Pyramid

LabLedger enforces an automated, multi-tiered testing strategy ensuring that every layer of the application is validated with speed, isolation, and production fidelity.

```
          / \
         /   \
        / E2E \       <-- Full System Workflows (SpringBootTest + Testcontainers)
       /-------\
      / Slice & \     <-- Slice Tests (@WebMvcTest, @DataJpaTest)
     / Int Tests \
    /-------------\
   /   Unit Tests  \  <-- Pure Domain & Service Tests (JUnit 5, Mockito, Vitest)
  /-----------------\
```

### Core Testing Mandates
1. **No Fake or Superficial Mocks**: Tests must assert real behavioral outcomes, status codes, and database state. Never create tests that mock everything just to satisfy coverage numbers.
2. **Production-Parity Persistence**: All repository and database integration tests run against **real PostgreSQL instances via Testcontainers**, never in-memory H2. H2 lacks support for PostgreSQL-specific features like `btree_gist`, `tstzrange` exclusion constraints, and `JSONB`.
3. **Deterministic & Isolated**: Each test runs in an isolated transaction that rolls back after completion, or operates with a clean container state. Tests must not depend on execution order.
4. **Coverage Targets**:
   - Minimum **80% line coverage** and **75% branch coverage** on all business service classes.
   - 100% of REST controller endpoints covered by `@WebMvcTest` verifying status codes, validation errors, and authorization guards.

---

## 2. Backend Testing Architecture

### 2.1 Unit Tests (JUnit 5 + Mockito + AssertJ)
- **Scope**: Domain logic, service calculations, custom validators, utility classes.
- **Speed**: Sub-millisecond execution; no Spring context loaded.
- **Example Targets**:
  - `TimeIntervalValidatorTest`: Asserts that $[start, end)$ intervals with $start \ge end$ are rejected.
  - `SparePartCostCalculatorTest`: Asserts `BigDecimal` precision and scale when calculating total repair costs.
  - `ReservationServiceUnitTest`: Asserts business rule validation when a student attempts to book without prerequisite safety certification.

### 2.2 Slice Tests
Slice tests load only the subset of the Spring application context required for the layer under test, providing fast feedback with real Spring wiring.

#### Controller Slice Tests (`@WebMvcTest`)
- Validates URL routing, HTTP verb matching, request body deserialization, Jakarta validation constraint enforcement, CSRF token handling, and HTTP status codes.
- Security filters and mock user authentication are applied using `@WithMockUser`.
```java
@WebMvcTest(ReservationController.class)
class ReservationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ReservationService reservationService;

    @Test
    @WithMockUser(roles = "STUDENT")
    void createReservation_withValidInterval_returns201Created() throws Exception {
        // Assert valid request returns 201 Created with Location header
    }

    @Test
    @WithMockUser(roles = "STUDENT")
    void createReservation_withPastDate_returns400BadRequest() throws Exception {
        // Assert RFC 7807 ProblemDetail response with field validation errors
    }

    @Test
    void createReservation_unauthenticated_returns401Unauthorized() throws Exception {
        // Assert unauthenticated request is rejected by Spring Security
    }
}
```

#### Repository Slice Tests (`@DataJpaTest` + Testcontainers)
- Validates custom Spring Data JPA query methods, native queries, specifications, and database constraints.
- Backed by `PostgreSQLContainer("postgres:16-alpine")`.
- Specifically validates:
  - The `btree_gist` exclusion constraint: attempting to insert overlapping active reservations throws `DataIntegrityViolationException`.
  - Audit trigger or entity listener timestamp population.

### 2.3 End-to-End Integration Tests (`@SpringBootTest`)
- Bootstraps the full Spring Boot application context on a random port (`webEnvironment = RANDOM_PORT`).
- Interacts via `TestRestTemplate` or `WebTestClient`.
- Executes end-to-end user journeys:
  1. Register user -> Login -> Obtain session cookie.
  2. Query equipment catalog.
  3. Submit reservation -> Receive 201 Created.
  4. Submit conflicting reservation -> Receive 409 Conflict with RFC 7807 error payload.
  5. Cancel first reservation -> Re-attempt second reservation -> Receive 201 Created.

---

## 3. Frontend Testing Architecture

### 3.1 Unit & Component Tests (Vitest + React Testing Library)
- **Runner**: Vitest (instant startup, ESM native, compatible with Vite).
- **DOM Environment**: `jsdom`.
- **Component Assertions**: React Testing Library focusing on accessible user behavior:
  - Querying by ARIA role (`screen.getByRole('button', { name: /reserve equipment/i })`).
  - Simulating user events via `@testing-library/user-event`.
  - Checking accessible form validation error announcements.

### 3.2 API Layer Mocking (Mock Service Worker - MSW)
- Intercepts requests at the network layer (`fetch`/`axios`), simulating real HTTP responses without mocking internal client code.
- Enables testing of:
  - Successful data fetching and table rendering.
  - Server error responses (HTTP 400 validation errors, HTTP 409 conflict notifications).
  - Network timeout and retry states.

---

## 4. Test Execution Commands

### Backend
```bash
# Run fast unit tests only
./mvnw test

# Run repository slice tests with Testcontainers
./mvnw test -Dtest=*RepositoryTest

# Run full integration and verification suite
./mvnw verify

# Generate JaCoCo code coverage report
./mvnw jacoco:report
```

### Frontend
```bash
# Run Vitest in watch mode (local development)
npm run test

# Run Vitest single pass with coverage (CI mode)
npm run test:run -- --coverage

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint
```

---

## 5. Continuous Integration (CI) Quality Gates

The GitHub Actions workflow enforces the following gates before any pull request can be merged:

1. **Compilation & Static Checks**: Zero Java compiler warnings; zero TypeScript compiler errors.
2. **Linting & Code Style**: Spotless / Checkstyle formatting clean; ESLint clean.
3. **Unit & Slice Tests**: 100% test pass rate across backend and frontend suites.
4. **Integration Tests**: Testcontainers-backed database tests must pass cleanly.
5. **Coverage Gate**: PR build fails if JaCoCo line coverage drops below 80% on core service modules.
