-- =============================================================================
-- Flyway Migration V5: Fault Reports and Maintenance Work Orders
-- =============================================================================

-- Ensure university core operational test accounts exist with BCrypt hash for 'password123'
DO $$
BEGIN
    -- 1. Administrator
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@university.edu') THEN
        INSERT INTO users (id, email, password_hash, first_name, last_name, department, status)
        VALUES ('10000000-0000-0000-0000-000000000001', 'admin@university.edu',
                '$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2',
                'Marcus', 'Vance', 'Laboratory Administration', 'ACTIVE');
        INSERT INTO user_roles (user_id, role)
        VALUES ('10000000-0000-0000-0000-000000000001', 'ROLE_ADMIN');
    END IF;

    -- 2. Lab Assistant
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'assistant@university.edu') THEN
        INSERT INTO users (id, email, password_hash, first_name, last_name, department, status)
        VALUES ('10000000-0000-0000-0000-000000000002', 'assistant@university.edu',
                '$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2',
                'Sarah', 'Jenkins', 'Physics & Chemistry Labs', 'ACTIVE');
        INSERT INTO user_roles (user_id, role)
        VALUES ('10000000-0000-0000-0000-000000000002', 'ROLE_LAB_ASSISTANT');
    END IF;

    -- 3. Dedicated Technician
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'technician@university.edu') THEN
        INSERT INTO users (id, email, password_hash, first_name, last_name, department, status)
        VALUES ('10000000-0000-0000-0000-000000000003', 'technician@university.edu',
                '$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2',
                'David', 'Kovacs', 'Scientific Instrumentation & Engineering', 'ACTIVE');
        INSERT INTO user_roles (user_id, role)
        VALUES ('10000000-0000-0000-0000-000000000003', 'ROLE_TECHNICIAN');
    END IF;

    -- 4. Student Researcher
    IF NOT EXISTS (SELECT 1 FROM users WHERE email = 'student@university.edu') THEN
        INSERT INTO users (id, email, password_hash, first_name, last_name, department, status)
        VALUES ('10000000-0000-0000-0000-000000000004', 'student@university.edu',
                '$2a$12$4vN8sT9jK0oO.G8dJ9WqzeY7M6lC3rF8lO1rN5mE3vA9wS7fD1kI2',
                'Elena', 'Rostova', 'Cell Biology & Genetics', 'ACTIVE');
        INSERT INTO user_roles (user_id, role)
        VALUES ('10000000-0000-0000-0000-000000000004', 'ROLE_STUDENT');
    END IF;
END $$;

-- 1. Fault Reports table
CREATE TABLE IF NOT EXISTS fault_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fault_number VARCHAR(50) NOT NULL UNIQUE,
    equipment_id UUID NOT NULL,
    reported_by_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    reported_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    triaged_by_id UUID,
    triaged_at TIMESTAMPTZ,
    triage_notes TEXT,
    resolved_by_id UUID,
    resolved_at TIMESTAMPTZ,
    resolution_details TEXT,
    closed_by_id UUID,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fault_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fault_reporter FOREIGN KEY (reported_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_fault_triaged_by FOREIGN KEY (triaged_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_fault_resolved_by FOREIGN KEY (resolved_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_fault_closed_by FOREIGN KEY (closed_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_fault_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT chk_fault_status CHECK (status IN ('OPEN', 'TRIAGED', 'IN_REPAIR', 'RESOLVED', 'CLOSED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_fault_reports_equipment ON fault_reports(equipment_id);
CREATE INDEX IF NOT EXISTS idx_fault_reports_reported_by ON fault_reports(reported_by_id);
CREATE INDEX IF NOT EXISTS idx_fault_reports_status ON fault_reports(status);
CREATE INDEX IF NOT EXISTS idx_fault_reports_severity ON fault_reports(severity);
CREATE INDEX IF NOT EXISTS idx_fault_reports_reported_at ON fault_reports(reported_at DESC);

-- 2. Maintenance Work Orders table
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_number VARCHAR(50) NOT NULL UNIQUE,
    fault_report_id UUID,
    equipment_id UUID NOT NULL,
    assigned_technician_id UUID,
    created_by_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED',
    blocked_reason TEXT,
    planned_start_date DATE,
    planned_completion_date DATE,
    actual_start_time TIMESTAMPTZ,
    actual_completion_time TIMESTAMPTZ,
    labor_hours NUMERIC(6, 2) DEFAULT 0.00,
    parts_cost NUMERIC(12, 2) DEFAULT 0.00,
    resolution_summary TEXT,
    passed_inspection BOOLEAN NOT NULL DEFAULT FALSE,
    inspected_by_id UUID,
    inspected_at TIMESTAMPTZ,
    inspection_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_work_order_fault FOREIGN KEY (fault_report_id) REFERENCES fault_reports(id) ON DELETE SET NULL,
    CONSTRAINT fk_work_order_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_order_technician FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_work_order_created_by FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT fk_work_order_inspected_by FOREIGN KEY (inspected_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_work_order_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
    CONSTRAINT chk_work_order_status CHECK (status IN ('CREATED', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_work_orders_fault ON maintenance_work_orders(fault_report_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_equipment ON maintenance_work_orders(equipment_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_technician ON maintenance_work_orders(assigned_technician_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON maintenance_work_orders(priority);

-- 3. Work Order Progress Notes / Diagnostic Logs
CREATE TABLE IF NOT EXISTS work_order_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL,
    author_id UUID NOT NULL,
    note_type VARCHAR(50) NOT NULL DEFAULT 'PROGRESS_UPDATE',
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_note_work_order FOREIGN KEY (work_order_id) REFERENCES maintenance_work_orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_note_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_note_type CHECK (note_type IN ('PROGRESS_UPDATE', 'DIAGNOSTIC_FINDING', 'PARTS_ORDERED', 'BLOCKER_FLAG', 'INSPECTION_NOTE'))
);

CREATE INDEX IF NOT EXISTS idx_work_order_notes_order_created ON work_order_notes(work_order_id, created_at ASC);

-- 4. Seed realistic fault reports & work orders
DO $$
DECLARE
    v_student_id UUID;
    v_assistant_id UUID;
    v_technician_id UUID;
    v_admin_id UUID;
    v_pcr_id UUID;
    v_spectro_id UUID;
    v_fault_1_id UUID := '40000000-0000-0000-0000-000000000001';
    v_fault_2_id UUID := '40000000-0000-0000-0000-000000000002';
    v_wo_1_id UUID := '50000000-0000-0000-0000-000000000001';
    v_wo_2_id UUID := '50000000-0000-0000-0000-000000000002';
BEGIN
    SELECT id INTO v_student_id FROM users WHERE email = 'student@university.edu';
    SELECT id INTO v_assistant_id FROM users WHERE email = 'assistant@university.edu';
    SELECT id INTO v_technician_id FROM users WHERE email = 'technician@university.edu';
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@university.edu';

    SELECT id INTO v_pcr_id FROM equipment WHERE asset_tag = 'EQ-BIO-005';
    SELECT id INTO v_spectro_id FROM equipment WHERE asset_tag = 'EQ-PHYS-002';

    IF v_student_id IS NOT NULL AND v_pcr_id IS NOT NULL THEN
        -- Active In-Repair Fault Report on PCR Thermocycler
        INSERT INTO fault_reports (
            id, fault_number, equipment_id, reported_by_id, title, description,
            severity, status, reported_at, triaged_by_id, triaged_at, triage_notes,
            created_at, updated_at
        ) VALUES (
            v_fault_1_id, 'FLT-2026-0001', v_pcr_id, v_student_id,
            'Thermal block thermal gradient sensor failure error ERR-304',
            'During stage 3 annealing, the heated lid failed to maintain 105C and block threw ERR-304 sensor communication error.',
            'HIGH', 'IN_REPAIR', NOW() - INTERVAL '3 days',
            v_assistant_id, NOW() - INTERVAL '2 days' + INTERVAL '2 hours',
            'Confirmed sensor malfunction with technician. Transferred equipment to UNDER_MAINTENANCE and dispatched work order.',
            NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'
        ) ON CONFLICT (fault_number) DO NOTHING;

        -- Work Order in progress for the PCR Thermocycler
        INSERT INTO maintenance_work_orders (
            id, work_order_number, fault_report_id, equipment_id, assigned_technician_id,
            created_by_id, title, description, priority, status,
            planned_start_date, planned_completion_date, actual_start_time,
            labor_hours, parts_cost, passed_inspection, created_at, updated_at
        ) VALUES (
            v_wo_1_id, 'WO-2026-0001', v_fault_1_id, v_pcr_id, v_technician_id,
            v_assistant_id, 'Replace Thermocycler Lid Sensor Harness',
            'Diagnose thermocouple connection and install replacement sensor harness assembly (Part #EPP-8842-TS).',
            'HIGH', 'IN_PROGRESS',
            CURRENT_DATE - 2, CURRENT_DATE + 2, NOW() - INTERVAL '1 day',
            3.50, 245.00, FALSE, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'
        ) ON CONFLICT (work_order_number) DO NOTHING;

        -- Progress note on the work order
        INSERT INTO work_order_notes (
            work_order_id, author_id, note_type, notes, created_at
        ) VALUES (
            v_wo_1_id, v_technician_id, 'DIAGNOSTIC_FINDING',
            'Confirmed intermittent resistance on pin 4 of ribbon connector. Replacement harness assembly ordered from manufacturer depot.',
            NOW() - INTERVAL '1 day'
        ) ON CONFLICT DO NOTHING;
    END IF;

    IF v_spectro_id IS NOT NULL AND v_assistant_id IS NOT NULL THEN
        -- Historic Resolved Fault Report on Spectrophotometer (passed inspection)
        INSERT INTO fault_reports (
            id, fault_number, equipment_id, reported_by_id, title, description,
            severity, status, reported_at, triaged_by_id, triaged_at, triage_notes,
            resolved_by_id, resolved_at, resolution_details,
            closed_by_id, closed_at, created_at, updated_at
        ) VALUES (
            v_fault_2_id, 'FLT-2026-0002', v_spectro_id, v_student_id,
            'Deuterium lamp output below calibration baseline',
            'Photometer self-test reported D2 lamp energy at 45% of nominal output (threshold 60%).',
            'MEDIUM', 'CLOSED', NOW() - INTERVAL '14 days',
            v_assistant_id, NOW() - INTERVAL '13 days', 'Lamp past rated 2000hr service life. Scheduled replacement.',
            v_technician_id, NOW() - INTERVAL '10 days', 'Replaced D2 lamp (Part #AG-D2-401). Ran 5-point optical verification test.',
            v_assistant_id, NOW() - INTERVAL '9 days', NOW() - INTERVAL '14 days', NOW() - INTERVAL '9 days'
        ) ON CONFLICT (fault_number) DO NOTHING;

        -- Historic completed work order
        INSERT INTO maintenance_work_orders (
            id, work_order_number, fault_report_id, equipment_id, assigned_technician_id,
            created_by_id, title, description, priority, status,
            planned_start_date, planned_completion_date, actual_start_time, actual_completion_time,
            labor_hours, parts_cost, resolution_summary, passed_inspection, inspected_by_id, inspected_at,
            inspection_notes, created_at, updated_at
        ) VALUES (
            v_wo_2_id, 'WO-2026-0002', v_fault_2_id, v_spectro_id, v_technician_id,
            v_assistant_id, 'Replace UV-Vis Deuterium Lamp and Recalibrate',
            'Install new pre-aligned deuterium lamp module and execute holmium oxide wavelength validation.',
            'MEDIUM', 'COMPLETED',
            CURRENT_DATE - 13, CURRENT_DATE - 10, NOW() - INTERVAL '11 days', NOW() - INTERVAL '10 days',
            2.00, 380.00, 'Replaced D2 lamp. Holmium oxide spectrum verification passed with zero offset.',
            TRUE, v_assistant_id, NOW() - INTERVAL '9 days',
            'Passed post-maintenance baseline validation. Certified ready for laboratory research.',
            NOW() - INTERVAL '13 days', NOW() - INTERVAL '9 days'
        ) ON CONFLICT (work_order_number) DO NOTHING;
    END IF;
END $$;
