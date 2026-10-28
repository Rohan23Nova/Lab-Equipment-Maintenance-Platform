-- ============================================================================
-- LabLedger Database Migration: V4__reservation_schema.sql
-- Module: Reservation & Scheduling Engine
-- Concurrency Strategy: PostgreSQL btree_gist Exclusion Constraint on Half-Open Intervals [)
-- ============================================================================

-- Ensure btree_gist extension is available for composite exclusion constraint (UUID + tstzrange)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ----------------------------------------------------------------------------
-- Table: reservations
-- Enforces half-open interval [start_time, end_time) scheduling with zero double-booking
-- ----------------------------------------------------------------------------
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    decision_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    decision_at TIMESTAMPTZ,
    rejection_reason TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Interval invariant: start_time strictly precedes end_time
    CONSTRAINT chk_reservation_time_interval CHECK (start_time < end_time),

    -- Status enum domain invariant
    CONSTRAINT chk_reservation_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')),

    -- Concurrency invariant: No two active/blocking reservations can overlap on the same instrument
    -- Uses half-open interval [) so adjacent slots [10:00, 11:00) and [11:00, 12:00) never collide
    CONSTRAINT exclude_overlapping_reservations
    EXCLUDE USING gist (
        equipment_id WITH =,
        tstzrange(start_time, end_time, '[)') WITH &&
    )
    WHERE (status IN ('PENDING', 'APPROVED'))
);

-- Performance Indexes
CREATE INDEX idx_reservations_equipment ON reservations(equipment_id);
CREATE INDEX idx_reservations_user ON reservations(user_id);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_time_range ON reservations(start_time, end_time);
CREATE INDEX idx_reservations_created ON reservations(created_at DESC);

-- ----------------------------------------------------------------------------
-- Realistic Demonstration & Testing Seed Data
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    v_admin_id UUID;
    v_assistant_id UUID;
    v_student_id UUID;
    v_zeiss_id UUID;
    v_leica_id UUID;
    v_cary_id UUID;
BEGIN
    SELECT id INTO v_admin_id FROM users WHERE email = 'admin@university.edu';
    SELECT id INTO v_assistant_id FROM users WHERE email = 'lab.assistant@university.edu';
    SELECT id INTO v_student_id FROM users WHERE email = 'student@university.edu';

    IF v_student_id IS NULL THEN
        SELECT id INTO v_student_id FROM users WHERE email = 'elena.rostova@university.edu';
    END IF;
    IF v_student_id IS NULL THEN
        SELECT id INTO v_student_id FROM users ORDER BY created_at ASC LIMIT 1;
    END IF;
    IF v_admin_id IS NULL THEN
        v_admin_id := v_student_id;
    END IF;
    IF v_assistant_id IS NULL THEN
        v_assistant_id := v_student_id;
    END IF;

    SELECT id INTO v_zeiss_id FROM equipment WHERE asset_tag = 'EQ-PHYS-001';
    SELECT id INTO v_cary_id FROM equipment WHERE asset_tag = 'EQ-PHYS-002';

    IF v_student_id IS NOT NULL AND v_zeiss_id IS NOT NULL THEN
        -- Completed past reservation: Yesterday 14:00 - 16:00 UTC
        INSERT INTO reservations (
            equipment_id, user_id, start_time, end_time, purpose, status,
            decision_by_user_id, decision_at, created_at, updated_at
        ) VALUES (
            v_zeiss_id,
            v_student_id,
            NOW() - INTERVAL '1 day' + INTERVAL '14 hours',
            NOW() - INTERVAL '1 day' + INTERVAL '16 hours',
            'Cell culture fluorescent tagging time-lapse microscopy experiment.',
            'COMPLETED',
            v_assistant_id,
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '2 days',
            NOW() - INTERVAL '1 day' + INTERVAL '16 hours'
        );

        -- Approved upcoming reservation: Tomorrow 10:00 - 12:00 UTC
        INSERT INTO reservations (
            equipment_id, user_id, start_time, end_time, purpose, status,
            decision_by_user_id, decision_at, created_at, updated_at
        ) VALUES (
            v_zeiss_id,
            v_student_id,
            NOW() + INTERVAL '1 day',
            NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
            'Live-cell calcium flux imaging for senior thesis research.',
            'APPROVED',
            v_assistant_id,
            NOW() - INTERVAL '4 hours',
            NOW() - INTERVAL '6 hours',
            NOW() - INTERVAL '4 hours'
        );

        -- Adjacent Approved reservation on same day: Tomorrow 12:00 - 14:00 UTC (proves adjacent slots allowed)
        IF v_admin_id IS NOT NULL THEN
            INSERT INTO reservations (
                equipment_id, user_id, start_time, end_time, purpose, status,
                decision_by_user_id, decision_at, created_at, updated_at
            ) VALUES (
                v_zeiss_id,
                v_admin_id,
                NOW() + INTERVAL '1 day' + INTERVAL '2 hours',
                NOW() + INTERVAL '1 day' + INTERVAL '4 hours',
                'Optics linearity verification and laser power calibration check.',
                'APPROVED',
                v_admin_id,
                NOW() - INTERVAL '2 hours',
                NOW() - INTERVAL '2 hours',
                NOW() - INTERVAL '2 hours'
            );
        END IF;
    END IF;

    IF v_student_id IS NOT NULL AND v_cary_id IS NOT NULL THEN
        -- Pending reservation awaiting approval: In 2 days 13:00 - 15:00 UTC
        INSERT INTO reservations (
            equipment_id, user_id, start_time, end_time, purpose, status,
            created_at, updated_at
        ) VALUES (
            v_cary_id,
            v_student_id,
            NOW() + INTERVAL '2 days',
            NOW() + INTERVAL '2 days' + INTERVAL '2 hours',
            'Spectrophotometric kinetics assays of enzyme denaturation curves.',
            'PENDING',
            NOW() - INTERVAL '1 hour',
            NOW() - INTERVAL '1 hour'
        );
    END IF;

END $$;
