-- =============================================================================
-- Flyway Migration V6: Notifications, Preferences, and Activity Audit Log Schema
-- =============================================================================

-- Notifications table for in-app alert center and delivery tracking
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    type VARCHAR(60) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    navigation_target VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    channel VARCHAR(30) NOT NULL DEFAULT 'IN_APP',
    idempotency_key VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_notifications_idempotency UNIQUE (idempotency_key),
    CONSTRAINT chk_notifications_channel CHECK (channel IN ('IN_APP', 'EMAIL', 'SMS'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Notification preferences per user
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reservation_reminders BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_lead_hours INT NOT NULL DEFAULT 2,
    maintenance_updates BOOLEAN NOT NULL DEFAULT TRUE,
    fault_alerts BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_notification_preferences_user UNIQUE (user_id),
    CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_pref_reminder_lead_hours CHECK (reminder_lead_hours BETWEEN 1 AND 72)
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);

-- Centralized immutable audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    actor_name VARCHAR(150) NOT NULL,
    actor_email VARCHAR(255),
    action VARCHAR(60) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id UUID NOT NULL,
    entity_identifier VARCHAR(150),
    summary VARCHAR(500) NOT NULL,
    details_json TEXT,
    ip_address VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Seed initial notification preferences for existing users
INSERT INTO notification_preferences (user_id, email_enabled, in_app_enabled, reservation_reminders, reminder_lead_hours, maintenance_updates, fault_alerts)
SELECT id, TRUE, TRUE, TRUE, 2, TRUE, TRUE
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Seed initial audit log for institutional platform setup
INSERT INTO audit_logs (
    actor_id, actor_name, actor_email, action, entity_type, entity_id, entity_identifier, summary, details_json
)
SELECT
    id, 'System Administrator', email, 'SYSTEM_CONFIGURED', 'SYSTEM', gen_random_uuid(), 'LABLEDGER-CORE',
    'LabLedger institutional auditing and notification subsystem initialized', '{"version":"Phase-07"}'
FROM users
WHERE email = 'admin@university.edu'
LIMIT 1;
