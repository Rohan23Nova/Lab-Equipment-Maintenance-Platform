-- =============================================================================
-- Flyway Migration V3: Equipment Inventory and Laboratory Management Schema
-- =============================================================================

-- 1. Enhance laboratories table with description and active status flag
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE laboratories ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Create equipment_categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_categories_code UNIQUE (code),
    CONSTRAINT uk_categories_name UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_categories_code ON equipment_categories(code);

-- 3. Create equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_tag VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL,
    laboratory_id UUID NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    model VARCHAR(150) NOT NULL,
    serial_number VARCHAR(150),
    condition VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    purchase_date DATE,
    purchase_cost NUMERIC(12, 2),
    warranty_expiration DATE,
    description TEXT,
    specifications TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_equipment_asset_tag UNIQUE (asset_tag),
    CONSTRAINT fk_equipment_category FOREIGN KEY (category_id) REFERENCES equipment_categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_equipment_laboratory FOREIGN KEY (laboratory_id) REFERENCES laboratories(id) ON DELETE RESTRICT,
    CONSTRAINT chk_equipment_condition CHECK (condition IN ('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'DAMAGED')),
    CONSTRAINT chk_equipment_status CHECK (status IN ('AVAILABLE', 'IN_USE', 'UNDER_MAINTENANCE', 'RESERVED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS idx_equipment_asset_tag ON equipment(asset_tag);
CREATE INDEX IF NOT EXISTS idx_equipment_laboratory ON equipment(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(category_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_condition ON equipment(condition);

-- 4. Create equipment_status_history table (Audit trail for lifecycle and status transitions)
CREATE TABLE IF NOT EXISTS equipment_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by_user_id UUID,
    reason VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_history_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    CONSTRAINT fk_history_user FOREIGN KEY (changed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_history_equipment ON equipment_status_history(equipment_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON equipment_status_history(created_at);

-- 5. Create equipment_documents table (Manuals, calibration certs, SOPs)
CREATE TABLE IF NOT EXISTS equipment_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL,
    title VARCHAR(200) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_by_user_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    CONSTRAINT fk_documents_user FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_documents_type CHECK (document_type IN ('USER_MANUAL', 'SAFETY_GUIDE', 'CALIBRATION_CERT', 'MAINTENANCE_LOG', 'OTHER'))
);

CREATE INDEX IF NOT EXISTS idx_documents_equipment ON equipment_documents(equipment_id);

-- 6. Seed initial laboratory facilities and categories
INSERT INTO laboratories (id, code, name, building, room_number, description, active)
VALUES 
    ('10000000-0000-0000-0000-000000000001', 'PHYS-QO', 'Quantum Optics & Nanoscale Lab', 'Rutherford Hall', 'Room 101B', 'Advanced optical tables, femtosecond laser diagnostics, and cryogenic benches.', TRUE),
    ('10000000-0000-0000-0000-000000000002', 'BIO-MAC', 'Macromolecular Biochemistry Bay', 'Franklin Science Wing', 'Room 204A', 'High-speed centrifugation, protein crystallization, and analytical chromatography.', TRUE),
    ('10000000-0000-0000-0000-000000000003', 'MAT-SYN', 'Materials Synthesis & Characterization', 'Curie Science Complex', 'Room 310', 'High-temperature tube furnaces, powder XRD, and mechanical stress testers.', TRUE),
    ('10000000-0000-0000-0000-000000000004', 'ENG-FAB', 'Microfabrication Cleanroom Suite', 'Tesla Engineering Hall', 'Room 100', 'Class 1000 cleanroom equipped with photolithography and plasma etching tools.', TRUE)
ON CONFLICT (code) DO NOTHING;

INSERT INTO equipment_categories (id, code, name, description)
VALUES 
    ('20000000-0000-0000-0000-000000000001', 'MICR', 'Microscopy & Imaging', 'Optical, confocal, inverted, and electron scanning microscope instruments.'),
    ('20000000-0000-0000-0000-000000000002', 'SPEC', 'Spectroscopy & Spectrometry', 'UV-Vis, FTIR, NMR spectrometers, and mass spectrometry instruments.'),
    ('20000000-0000-0000-0000-000000000003', 'CENT', 'Centrifugation & Separation', 'High-speed floor centrifuges, microcentrifuges, and analytical ultracentrifuges.'),
    ('20000000-0000-0000-0000-000000000004', 'CHRO', 'Chromatography Systems', 'HPLC, UPLC, GC, and flash chromatography separation systems.'),
    ('20000000-0000-0000-0000-000000000005', 'THER', 'Thermal & Incubation', 'Autoclaves, PCR thermocyclers, muffle furnaces, and -80C ultra-low freezers.'),
    ('20000000-0000-0000-0000-000000000006', 'METR', 'Metrology & Analytical Balances', 'Precision micro-balances, atomic force profilers, and calibration standards.')
ON CONFLICT (code) DO NOTHING;

-- 7. Seed sample university equipment instruments
INSERT INTO equipment (
    id, asset_tag, name, category_id, laboratory_id, manufacturer, model, serial_number, condition, status, purchase_date, purchase_cost, warranty_expiration, description, specifications
)
VALUES 
    (
        '30000000-0000-0000-0000-000000000001', 'EQ-PHYS-001', 'Zeiss Axio Observer 7 Inverted Microscope',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Carl Zeiss AG', 'Axio Observer 7', 'ZEISS-AO7-8891', 'EXCELLENT', 'AVAILABLE',
        '2024-03-15', 78500.00, '2027-03-15',
        'Motorized inverted research microscope for live-cell imaging and multi-channel fluorescence.',
        'Magnification: 10x-100x Oil; Light Source: Colibri 7 LED; Camera: Axiocam 702 mono'
    ),
    (
        '30000000-0000-0000-0000-000000000002', 'EQ-PHYS-002', 'Agilent Cary 60 UV-Vis Spectrophotometer',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001',
        'Agilent Technologies', 'Cary 60', 'AG-C60-2041', 'GOOD', 'AVAILABLE',
        '2023-08-10', 14200.00, '2026-08-10',
        'Double-beam UV-Vis spectrophotometer with xenon flash lamp for routine and kinetic analysis.',
        'Wavelength Range: 190-1100 nm; Scan Rate: 24,000 nm/min; Optical Resolution: 1.5 nm'
    ),
    (
        '30000000-0000-0000-0000-000000000003', 'EQ-BIO-003', 'Beckman Coulter Optima XPN-100 Ultracentrifuge',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002',
        'Beckman Coulter', 'Optima XPN-100', 'BC-XPN-9011', 'GOOD', 'IN_USE',
        '2022-11-20', 84000.00, '2025-11-20',
        'Preparative ultracentrifuge generating centrifugal forces up to 802,400 x g.',
        'Max Speed: 100,000 RPM; Refrigeration: 0C to +40C; Vacuum System: Diffusion pump'
    ),
    (
        '30000000-0000-0000-0000-000000000004', 'EQ-BIO-004', 'Waters ACQUITY Premier UPLC System',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002',
        'Waters Corporation', 'ACQUITY Premier', 'WAT-UPLC-4412', 'EXCELLENT', 'AVAILABLE',
        '2024-01-18', 92000.00, '2027-01-18',
        'Ultra-performance liquid chromatography instrument with MaxPeak High Performance Surfaces.',
        'Max Pressure: 15,000 psi; Flow Rate: 0.001-2.000 mL/min; Column Temp: 4C-90C'
    ),
    (
        '30000000-0000-0000-0000-000000000005', 'EQ-BIO-005', 'Eppendorf Mastercycler X50a PCR Thermocycler',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002',
        'Eppendorf SE', 'Mastercycler X50a', 'EPP-MC50-1049', 'FAIR', 'UNDER_MAINTENANCE',
        '2021-06-05', 12500.00, '2024-06-05',
        'Gradient thermal cycler with heating rate up to 10 C/s for high-yield PCR amplification.',
        'Block Format: 96-well 0.2 mL; Gradient Range: 1C-30C; Temp Range: 4C-99C'
    ),
    (
        '30000000-0000-0000-0000-000000000006', 'EQ-MAT-006', 'Mettler Toledo XPR205 Analytical Microbalance',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000003',
        'Mettler Toledo', 'XPR205', 'MT-XPR-5520', 'EXCELLENT', 'AVAILABLE',
        '2024-05-12', 8900.00, '2027-05-12',
        'Semi-micro balance with motorized draft shield and static detection for high-precision weighing.',
        'Capacity: 220 g; Readability: 0.01 mg; Repeatability: 0.007 mg'
    ),
    (
        '30000000-0000-0000-0000-000000000007', 'EQ-MAT-007', 'Thermo Scientific Lindberg 1200C Tube Furnace',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000003',
        'Thermo Fisher Scientific', 'Lindberg/Blue M 1200C', 'TF-TF12-3033', 'GOOD', 'AVAILABLE',
        '2022-09-14', 18750.00, '2025-09-14',
        'Split-hinge programmable tube furnace for chemical vapor deposition and ceramic annealing.',
        'Max Temp: 1200C; Heated Length: 12 in; Process Tube: 1 to 3 in OD'
    ),
    (
        '30000000-0000-0000-0000-000000000008', 'EQ-ENG-008', 'Olympus BX53 Upright Fluorescence Microscope',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004',
        'Olympus Evident', 'BX53', 'OLY-BX53-6112', 'GOOD', 'AVAILABLE',
        '2023-04-22', 38000.00, '2026-04-22',
        'Modular upright clinical and materials microscope with high-intensity LED fluorescence illumination.',
        'Objectives: 4x, 10x, 20x, 40x, 100x; Illumination: True-color LED; Field Number: 22'
    )
ON CONFLICT (asset_tag) DO NOTHING;

-- Initial audit history records for seeded items
INSERT INTO equipment_status_history (equipment_id, previous_status, new_status, reason, notes)
SELECT id, NULL, status, 'INITIAL_COMMISSIONING', 'Initial instrument commission and entry into university inventory ledger.'
FROM equipment
ON CONFLICT DO NOTHING;
