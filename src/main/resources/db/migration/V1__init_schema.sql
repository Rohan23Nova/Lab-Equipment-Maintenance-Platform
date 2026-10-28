-- =============================================================================
-- Flyway Migration V1: Initial Core Schema for LabLedger
-- Creates extensions, users, user_roles, and laboratories
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table representing academic personnel (students, faculty, managers, admins)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- Role mappings for Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_roles_role CHECK (role IN ('ROLE_STUDENT', 'ROLE_FACULTY', 'ROLE_LAB_MANAGER', 'ROLE_ADMIN'))
);

-- Laboratories table representing university research bays and facilities
CREATE TABLE IF NOT EXISTS laboratories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    building VARCHAR(100) NOT NULL,
    room_number VARCHAR(50) NOT NULL,
    manager_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_labs_code UNIQUE (code),
    CONSTRAINT fk_labs_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_labs_manager ON laboratories(manager_id);
