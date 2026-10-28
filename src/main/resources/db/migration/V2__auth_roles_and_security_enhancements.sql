-- =============================================================================
-- Flyway Migration V2: Authentication, Security & Role Enhancements
-- Adds lockout tracking and expands role definitions
-- =============================================================================

-- Expand permitted role definitions for user_roles table
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS chk_user_roles_role;
ALTER TABLE user_roles ADD CONSTRAINT chk_user_roles_role 
    CHECK (role IN (
        'ROLE_STUDENT',
        'ROLE_FACULTY',
        'ROLE_LAB_ASSISTANT',
        'ROLE_TECHNICIAN',
        'ROLE_LAB_MANAGER',
        'ROLE_ADMIN'
    ));

-- Throttling & lockout tracking columns for brute-force protection
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lockout_until TIMESTAMPTZ;
