# LabLedger Security Architecture & Specifications

## 1. Security Philosophy & Threat Model

LabLedger manages university research assets, sensitive chemical/mechanical instruments, and academic schedules. Security design emphasizes defense-in-depth, least privilege, zero trust within internal components, and robust protection against OWASP Top 10 vulnerabilities.

### Threat Model Matrix

| Threat Category | Potential Vector | LabLedger Mitigation |
|---|---|---|
| **Broken Authentication** | Credential stuffing, brute force, session hijacking | BCrypt hashing (cost 12), secure server-side `JSESSIONID` cookies (`HttpOnly`, `Secure`, `SameSite=Strict`), session fixation prevention, failed login lockout. |
| **Cross-Site Request Forgery (CSRF)** | Malicious third-party origin submitting state-changing booking/maintenance actions | Strict Spring Security CSRF defense using `CookieCsrfTokenRepository.withHttpOnlyFalse()` and SPA `X-XSRF-TOKEN` header validation. |
| **Broken Access Control** | Student attempting to approve reservations or triage work orders | Multi-tier RBAC (`@PreAuthorize("hasRole('LAB_MANAGER')")`), method-level security, tenant/laboratory ownership checks in service layer. |
| **Injection (SQL/Command)** | Malicious input in search filters or asset tags | Strict use of Spring Data JPA parameterized queries and Criteria API; zero dynamic string concatenation in SQL; Hibernate strict validation. |
| **Cross-Site Scripting (XSS)** | Stored XSS in fault report descriptions or equipment notes | React DOM auto-escaping, Content Security Policy (CSP) headers, strict server-side Jakarta validation. |
| **Security Misconfiguration** | Leaked secrets, default credentials, verbose stack traces in production | Environment variable externalization via `.env`, disabled Hibernate schema generation, RFC 7807 sanitized error responses. |
| **Insufficient Logging & Monitoring** | Undetected unauthorized access or sabotage | Append-only `audit_logs` table tracking all state changes, Spring Security audit event listener. |

---

## 2. Authentication Strategy: Server-Side Sessions

### 2.1 Why Stateful Server-Side Sessions Over JWT?
Stateless JWTs stored in browser `localStorage` or `sessionStorage` are vulnerable to XSS theft and cannot be instantaneously revoked if a user account is suspended or a credential is leaked.

LabLedger uses **Spring Security server-side sessions** backed by standard servlet container session storage:
1. Upon successful login (`POST /api/v1/auth/login`), the server creates an `HttpSession` and returns a `Set-Cookie: JSESSIONID=...` header.
2. The session identifier is cryptographically random and references server-managed state.
3. Logout (`POST /api/v1/auth/logout`) explicitly invalidates the `HttpSession` and purges the security context.

### 2.2 Cookie Configuration
Session cookies are fortified with strict browser security attributes:

```yaml
server:
  servlet:
    session:
      timeout: 30m
      cookie:
        name: JSESSIONID
        http-only: true
        secure: true # active in production/HTTPS, toggleable in dev
        same-site: STRICT
        path: /api
```

- **`http-only: true`**: JavaScript cannot read `document.cookie`, neutralizing session theft via XSS.
- **`secure: true`**: Transmitted only over encrypted TLS/HTTPS connections.
- **`same-site: STRICT`**: The browser refrains from sending the cookie on cross-site requests, providing initial CSRF defense.

---

## 3. Cross-Site Request Forgery (CSRF) Protection

Because session cookies are automatically dispatched by browsers on matching domain requests, CSRF defense is mandatory for all state-mutating HTTP methods (`POST`, `PUT`, `PATCH`, `DELETE`).

### 3.1 SPA-Compatible Double-Submit / Header Pattern
Spring Security is configured to provide an anti-CSRF token readable by JavaScript, while the session cookie remains `HttpOnly`:

```java
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new SpaCsrfTokenRequestHandler())
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                .sessionFixation(SessionFixationConfigurer::migrateSession)
                .maximumSessions(2)
                .maxSessionsPreventsLogin(false)
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/login", "/api/v1/auth/register", "/api/v1/auth/csrf").permitAll()
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/lab-manager/**").hasAnyRole("LAB_MANAGER", "ADMIN")
                .anyRequest().authenticated()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                .accessDeniedHandler(new CustomAccessDeniedHandler())
            );

        return http.build();
    }
}
```

### 3.2 SPA Request Lifecycle
1. On initial load, the React application invokes `GET /api/v1/auth/csrf`.
2. The server generates a token and sets the cookie `XSRF-TOKEN` (`HttpOnly: false`).
3. The Axios HTTP client intercepts every mutating request (`POST`, `PUT`, `DELETE`, `PATCH`), extracts the `XSRF-TOKEN` cookie, and appends the header:
   `X-XSRF-TOKEN: <token-value>`
4. Spring Security validates the incoming header against the token stored in the server session. If they mismatch or the header is absent, Spring Security aborts the request with `HTTP 403 Forbidden`.

---

## 4. Role-Based Access Control (RBAC) Matrix

LabLedger enforces 5 distinct roles:

1. **`ROLE_ADMIN`**: Full administrative authority: user management, status activation/suspension, facility management, system settings, and audit ledger inspection.
2. **`ROLE_LAB_ASSISTANT`**: Laboratory supervisors managing assigned lab equipment, reservation calendars, fault triage, and maintenance workflows.
3. **`ROLE_TECHNICIAN`**: Maintenance specialists inspecting assigned work orders, updating repair milestones, and logging repair resolutions.
4. **`ROLE_STUDENT`**: Enrolled students browsing permitted equipment, scheduling reservations, and filing fault/defect reports.
5. **`ROLE_FACULTY`**: Academic faculty booking specialized research instruments, supervising student lab reservations, and inspecting departmental utilization.

### RBAC Permission Matrix

| Capability / Endpoint Group | Student | Faculty | Technician | Lab Assistant | Admin |
|---|:---:|:---:|:---:|:---:|:---:|
| Browse Equipment Catalog (`GET /api/v1/equipment/**`) | Read | Read | Read | Read | Read |
| Create / Edit Equipment Items (`POST/PUT /api/v1/equipment/**`) | - | - | - | Lab Only | Full |
| Request Equipment Reservation (`POST /api/v1/reservations`) | Own | Own | - | Any | Any |
| Approve / Reject Reservations (`PATCH /api/v1/reservations/{id}/approval`) | - | - | - | Lab Only | Full |
| Check-in / Check-out (`POST /api/v1/reservations/{id}/check-in`) | Own | Own | - | Any | Any |
| Submit Fault Report (`POST /api/v1/fault-reports`) | Any | Any | Any | Any | Any |
| Triage Fault / Create Work Order (`POST /api/v1/maintenance/work-orders`) | - | - | - | Lab Only | Full |
| Work Order Execution (`PUT /api/v1/maintenance/work-orders/{id}`) | - | - | Assigned | Lab Only | Full |
| User Status & Management (`PATCH /api/v1/users/{id}/status`) | - | - | - | - | Full |
| View System Audit Logs (`GET /api/v1/audit/**`) | - | - | - | - | Full |

---

## 5. Password Security & Storage

- **Algorithm**: `BCryptPasswordEncoder` configured with cost factor **12** (work factor $2^{12} = 4096$ rounds).
- **Password Constraints**:
  - Minimum 10 characters, maximum 128 characters.
  - At least one uppercase letter, one lowercase letter, one digit, and one special symbol (`@$!%*?&#`).
  - Prohibits common sequences or matching the user's email address.
- **Account Lockout Policy**:
  - 5 consecutive failed authentication attempts trigger a temporary 15-minute lock on the account to thwart brute force dictionary attacks.

---

## 6. HTTP Security Headers

The backend sets stringent security response headers via Spring Security:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
Permissions-Policy: geolocation=(), camera=(), microphone=()
```

---

## 7. Secrets Management & Environment Isolation

- **Zero Hardcoded Secrets**: Passwords, API tokens, database connection strings, and encryption keys are strictly read from environment variables.
- **`.env.example` Baseline**: A template file documents required variable keys, default local dev ports, and dummy examples without real credentials.
- **Production Profiles**: Running with `SPRING_PROFILES_ACTIVE=prod` enables strict credential validation, enforces HTTPS cookie flags, and shuts down test endpoints.
