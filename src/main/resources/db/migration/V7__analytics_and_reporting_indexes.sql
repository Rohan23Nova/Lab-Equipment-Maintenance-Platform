-- ============================================================================
-- LabLedger Database Migration: V7__analytics_and_reporting_indexes.sql
-- Module: Operational Dashboards & Analytics
-- Indexes for High-Performance Aggregate Reporting and Utilization Calculations
-- ============================================================================

-- Fast lookup for overdue work orders by status and planned completion date
CREATE INDEX IF NOT EXISTS idx_work_orders_overdue_check
ON maintenance_work_orders(status, planned_completion_date);

-- Fast lookup for upcoming approved reservations
CREATE INDEX IF NOT EXISTS idx_reservations_status_start
ON reservations(status, start_time);

-- Fast lookup for active critical faults
CREATE INDEX IF NOT EXISTS idx_faults_status_severity
ON fault_reports(status, severity);

-- Composite index for equipment status by laboratory for filtered inventory rollups
CREATE INDEX IF NOT EXISTS idx_equipment_lab_status
ON equipment(laboratory_id, status);

-- Composite index for reservation overlap by equipment, status, and time range
CREATE INDEX IF NOT EXISTS idx_reservations_equip_status_time
ON reservations(equipment_id, status, start_time, end_time);
