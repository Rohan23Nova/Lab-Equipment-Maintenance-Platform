-- ==============================================================================
-- Migration: V8__teaching_experiments_and_first_year_curriculum.sql
-- Description: Replace research demo dataset with realistic B.Tech First-Year
--              Undergraduate Teaching Laboratories (PHY-101, CHM-101, ELE-101,
--              ECE-101, WKS-101, CSL-101), add curriculum teaching experiments,
--              and populate ~41 realistic academic teaching equipment records.
-- ==============================================================================

-- 1. Create teaching_experiments table
CREATE TABLE IF NOT EXISTS teaching_experiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    objective TEXT NOT NULL,
    description TEXT NOT NULL,
    laboratory_id UUID REFERENCES laboratories(id) ON DELETE SET NULL,
    manual_reference VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create experiment_equipment many-to-many junction table
CREATE TABLE IF NOT EXISTS experiment_equipment (
    experiment_id UUID NOT NULL REFERENCES teaching_experiments(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
    PRIMARY KEY (experiment_id, equipment_id)
);

CREATE INDEX IF NOT EXISTS idx_experiments_code ON teaching_experiments(code);
CREATE INDEX IF NOT EXISTS idx_experiments_laboratory ON teaching_experiments(laboratory_id);
CREATE INDEX IF NOT EXISTS idx_experiments_subject ON teaching_experiments(subject);
CREATE INDEX IF NOT EXISTS idx_exp_equip_equipment ON experiment_equipment(equipment_id);

-- 3. Update existing 4 research laboratories to B.Tech First-Year Teaching Labs
-- Preserve existing UUIDs so existing foreign keys remain strictly valid
UPDATE laboratories
SET 
    code = 'PHY-101',
    name = 'Engineering Physics Laboratory',
    building = 'Raman Science Block',
    room_number = 'Room 102',
    description = 'Undergraduate practical laboratory for optics, wave mechanics, lasers, and semiconductor physics experiments.',
    active = TRUE
WHERE id = '10000000-0000-0000-0000-000000000001';

UPDATE laboratories
SET 
    code = 'CHM-101',
    name = 'Engineering Chemistry Laboratory',
    building = 'P.C. Ray Chemical Sciences Wing',
    room_number = 'Room 204',
    description = 'Undergraduate chemistry facility for volumetric titrations, water hardness testing, viscosity, pH, and conductometric analysis.',
    active = TRUE
WHERE id = '10000000-0000-0000-0000-000000000002';

UPDATE laboratories
SET 
    code = 'ELE-101',
    name = 'Basic Electrical Engineering Laboratory',
    building = 'Faraday Electrical Engineering Complex',
    room_number = 'Room 112',
    description = 'First-year instructional laboratory dedicated to circuit theorems (Ohm/Kirchhoff), AC circuit resonance, single-phase transformers, and power measurements.',
    active = TRUE
WHERE id = '10000000-0000-0000-0000-000000000003';

UPDATE laboratories
SET 
    code = 'ECE-101',
    name = 'Basic Electronics Laboratory',
    building = 'Bose Electronics & Communications Building',
    room_number = 'Room 205',
    description = 'Instructional laboratory for solid-state diode characteristics, transistor biasing, rectifier wave shaping, digital logic gates, and oscilloscope measurements.',
    active = TRUE
WHERE id = '10000000-0000-0000-0000-000000000004';

-- Insert the 5th and 6th first-year teaching facilities
INSERT INTO laboratories (id, code, name, building, room_number, description, active)
VALUES 
    (
        '10000000-0000-0000-0000-000000000005', 'WKS-101',
        'Engineering Workshop and Manufacturing Practice',
        'Central Workshop & Manufacturing Complex', 'Bay 3 (Fitting & Machining)',
        'Hands-on practical training facility for mechanical fitting, sheet metal fabrication, carpentry joints, bench drilling, and precision measurement.',
        TRUE
    ),
    (
        '10000000-0000-0000-0000-000000000006', 'CSL-101',
        'Programming and Computer Laboratory',
        'Turing Computing & Informatics Center', 'Lab 3 (First Floor)',
        'Undergraduate computing laboratory equipped with networked Linux/Windows workstations for C, Python, data structures, and algorithmic practicals.',
        TRUE
    )
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    building = EXCLUDED.building,
    room_number = EXCLUDED.room_number,
    description = EXCLUDED.description,
    active = EXCLUDED.active;

-- 4. Update and add Equipment Categories for First-Year Undergraduate Engineering
UPDATE equipment_categories
SET code = 'OPT-PHY', name = 'Physics & Optical Apparatus', description = 'Travelling microscopes, spectrometers, optical benches, and physical measurement apparatus.'
WHERE id = '20000000-0000-0000-0000-000000000001';

UPDATE equipment_categories
SET code = 'CHM-ANA', name = 'Chemical Analysis & Titration', description = 'Analytical balances, pH meters, conductivity meters, viscometers, and titration stations.'
WHERE id = '20000000-0000-0000-0000-000000000002';

UPDATE equipment_categories
SET code = 'ELE-CKT', name = 'Electrical Circuits & Machines', description = 'Digital multimeters, transformer trainers, power supplies, wattmeters, and RLC resonance kits.'
WHERE id = '20000000-0000-0000-0000-000000000003';

UPDATE equipment_categories
SET code = 'ECE-TST', name = 'Electronics Test & Measurement', description = 'Digital storage oscilloscopes, function generators, diode/transistor trainers, and digital logic trainers.'
WHERE id = '20000000-0000-0000-0000-000000000004';

UPDATE equipment_categories
SET code = 'WKS-MCH', name = 'Workshop & Manufacturing Tools', description = 'Cast-iron bench vices, pillar drilling machines, fitting hand tool kits, sheet metal snips, and carpentry tools.'
WHERE id = '20000000-0000-0000-0000-000000000005';

UPDATE equipment_categories
SET code = 'CSL-WRK', name = 'Computing & Networking Stations', description = 'Multi-core developer workstations, network switches, and uninterruptible power supply systems.'
WHERE id = '20000000-0000-0000-0000-000000000006';

-- 5. Update existing 8 equipment records to B.Tech First-Year Teaching Equipment
-- Preserves existing UUIDs to maintain referential integrity with reservations & work orders
UPDATE equipment
SET 
    asset_tag = 'EQ-PHY-MIC-01',
    name = 'Heavy-Base Dual-Axis Travelling Microscope',
    category_id = '20000000-0000-0000-0000-000000000001',
    laboratory_id = '10000000-0000-0000-0000-000000000001',
    manufacturer = 'Opto-Scientific Instruments',
    model = 'TM-200X',
    serial_number = 'OSI-TM-4410',
    condition = 'GOOD',
    status = 'AVAILABLE',
    purchase_date = '2023-07-10',
    purchase_cost = 450.00,
    warranty_expiration = '2026-07-10',
    description = 'Precision vernier travelling microscope with 0.01 mm least count for capillary tube and Newton''s rings diameter measurements.',
    specifications = 'Magnification: 10x-50x; Horizontal Scale: 0-200 mm with 0.01 mm vernier; Vertical Scale: 0-150 mm; Rack & pinion fine focus'
WHERE id = '30000000-0000-0000-0000-000000000001';

UPDATE equipment
SET 
    asset_tag = 'EQ-PHY-OPT-01',
    name = 'High-Precision Optical Bench Set with Sodium Lamp',
    category_id = '20000000-0000-0000-0000-000000000001',
    laboratory_id = '10000000-0000-0000-0000-000000000001',
    manufacturer = 'Standard Scientific Labs',
    model = 'OB-2000',
    serial_number = 'SSL-OB-8821',
    condition = 'EXCELLENT',
    status = 'AVAILABLE',
    purchase_date = '2023-08-15',
    purchase_cost = 620.00,
    warranty_expiration = '2026-08-15',
    description = 'Two-meter stainless steel twin-rail optical bench with leveling carriages, slit, biprism mount, and 35W sodium vapour illumination.',
    specifications = 'Bed Length: 2000 mm; Scale: Metric SS etched (1 mm div); 4 heavy-duty movable uprights with zero-backlash fine transversal motion'
WHERE id = '30000000-0000-0000-0000-000000000002';

UPDATE equipment
SET 
    asset_tag = 'EQ-CHM-STR-01',
    name = 'Digital Magnetic Stirrer with Ceramic Hot Plate',
    category_id = '20000000-0000-0000-0000-000000000002',
    laboratory_id = '10000000-0000-0000-0000-000000000002',
    manufacturer = 'Borosil Scientific',
    model = 'MS-HP-300',
    serial_number = 'BS-MSHP-2019',
    condition = 'GOOD',
    status = 'IN_USE',
    purchase_date = '2022-11-20',
    purchase_cost = 320.00,
    warranty_expiration = '2025-11-20',
    description = 'Microprocessor-controlled heating magnetic stirrer for endothermic dissolving and constant-temperature solution reaction kinetics.',
    specifications = 'Speed Range: 100-1500 RPM; Temp Range: Ambient to 350C; Plate Material: Chemical-resistant white ceramic; Max Stir Volume: 3 L'
WHERE id = '30000000-0000-0000-0000-000000000003';

UPDATE equipment
SET 
    asset_tag = 'EQ-CHM-CON-01',
    name = 'Digital Conductivity Meter with Dip-Type Cell',
    category_id = '20000000-0000-0000-0000-000000000002',
    laboratory_id = '10000000-0000-0000-0000-000000000002',
    manufacturer = 'Systronics India',
    model = 'Type 306',
    serial_number = 'SYS-CON-3061',
    condition = 'EXCELLENT',
    status = 'AVAILABLE',
    purchase_date = '2024-01-18',
    purchase_cost = 280.00,
    warranty_expiration = '2027-01-18',
    description = 'Microcontroller-based conductivity analyzer for conductometric titrations, total dissolved solids, and electrolytic dissociation assays.',
    specifications = 'Conductivity Range: 0.1 uS/cm to 100 mS/cm; Accuracy: +/- 1% FS; Cell Constant: 1.0 cm-1 platinized platinum electrode'
WHERE id = '30000000-0000-0000-0000-000000000004';

UPDATE equipment
SET 
    asset_tag = 'EQ-ELE-TRN-01',
    name = 'Single-Phase Step-Down & Isolation Transformer Trainer (1 kVA)',
    category_id = '20000000-0000-0000-0000-000000000003',
    laboratory_id = '10000000-0000-0000-0000-000000000003',
    manufacturer = 'Scientech Technologies',
    model = 'Scientech 2451',
    serial_number = 'SCI-TRN-2451',
    condition = 'FAIR',
    status = 'UNDER_MAINTENANCE',
    purchase_date = '2021-06-05',
    purchase_cost = 750.00,
    warranty_expiration = '2024-06-05',
    description = 'Educational transformer workstation with open circuit, short circuit, and loading terminals for efficiency and regulation experiments.',
    specifications = 'Rating: 1 kVA; Primary: 230V AC; Secondary: 115V / 230V center-tapped; Frequency: 50 Hz; Built-in MCB and fuse protection'
WHERE id = '30000000-0000-0000-0000-000000000005';

UPDATE equipment
SET 
    asset_tag = 'EQ-ECE-DSO-01',
    name = 'Tektronix 50MHz Dual-Channel Digital Storage Oscilloscope #01',
    category_id = '20000000-0000-0000-0000-000000000004',
    laboratory_id = '10000000-0000-0000-0000-000000000004',
    manufacturer = 'Tektronix Inc.',
    model = 'TBS1052B-EDU',
    serial_number = 'TEK-TBS-5021',
    condition = 'EXCELLENT',
    status = 'AVAILABLE',
    purchase_date = '2024-05-12',
    purchase_cost = 520.00,
    warranty_expiration = '2027-05-12',
    description = 'Educational digital storage oscilloscope with 1 GS/s sampling, FFT frequency analysis, and automated wave parameter measurement cursors.',
    specifications = 'Bandwidth: 50 MHz; Channels: 2; Sample Rate: 1.0 GS/s per channel; Record Length: 2.5k points; 7-inch WVGA color display'
WHERE id = '30000000-0000-0000-0000-000000000006';

UPDATE equipment
SET 
    asset_tag = 'EQ-WKS-DRL-01',
    name = 'Geared Motorized Bench Pillar Drilling Machine',
    category_id = '20000000-0000-0000-0000-000000000005',
    laboratory_id = '10000000-0000-0000-0000-000000000005',
    manufacturer = 'Batliboi Machine Tools',
    model = 'BPD-13',
    serial_number = 'BAT-DRL-1308',
    condition = 'GOOD',
    status = 'AVAILABLE',
    purchase_date = '2022-09-14',
    purchase_cost = 890.00,
    warranty_expiration = '2025-09-14',
    description = 'Precision bench drilling unit with 13 mm chuck capacity, 4-step pulley speed control, and cast iron drill table for sheet metal fabrication.',
    specifications = 'Drill Capacity: 13 mm in MS; Spindle Travel: 60 mm; Motor: 0.5 HP 1440 RPM 230V AC; Speeds: 4 (500 to 2800 RPM)'
WHERE id = '30000000-0000-0000-0000-000000000007';

UPDATE equipment
SET 
    asset_tag = 'EQ-CSL-PC-01',
    name = 'Dell OptiPlex 7090 Core i7 Programming Workstation #01',
    category_id = '20000000-0000-0000-0000-000000000006',
    laboratory_id = '10000000-0000-0000-0000-000000000006',
    manufacturer = 'Dell Technologies',
    model = 'OptiPlex 7090 MT',
    serial_number = 'DELL-OPT-70901',
    condition = 'EXCELLENT',
    status = 'AVAILABLE',
    purchase_date = '2023-04-22',
    purchase_cost = 980.00,
    warranty_expiration = '2026-04-22',
    description = 'Undergraduate programming workstation configured with GCC, Clang, Python 3, OpenJDK 21, Git, and VS Code for curriculum practicals.',
    specifications = 'CPU: Intel Core i7-11700 (8C/16T, up to 4.9 GHz); RAM: 16 GB DDR4; SSD: 512 GB NVMe; OS: Ubuntu 22.04 LTS / Windows 11 Pro Dual-Boot'
WHERE id = '30000000-0000-0000-0000-000000000008';

-- Update existing sample work order & fault report description to reflect transformer maintenance
UPDATE fault_reports
SET 
    title = 'Transformer Secondary Terminal Strip Loose Connection',
    description = 'During full-load heat run practical, secondary terminal block heated noticeably and terminal screw showed intermittent contact resistance.'
WHERE id = '40000000-0000-0000-0000-000000000001';

UPDATE maintenance_work_orders
SET 
    title = 'Re-terminate and Torque Transformer Secondary Lug Strip',
    description = 'Inspect secondary lug terminal strip, replace heat-degraded insulation washers, and torque all connection points to manufacturer specification.'
WHERE id = '50000000-0000-0000-0000-000000000001';

-- 6. Insert remaining 33 B.Tech First-Year Teaching Equipment Records (Total: 41)
INSERT INTO equipment (
    id, asset_tag, name, category_id, laboratory_id, manufacturer, model, serial_number, condition, status, purchase_date, purchase_cost, warranty_expiration, description, specifications
)
VALUES 
    -- ── Engineering Physics (PHY-101) ──
    (
        '30000000-0000-0000-0000-000000000009', 'EQ-PHY-VER-01',
        'Mitutoyo Standard Vernier Calipers (0.02 mm LC)',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Mitutoyo Corporation', '530-104', 'MIT-VC-9012', 'GOOD', 'AVAILABLE',
        '2023-01-15', 65.00, '2026-01-15',
        'Hardened stainless steel vernier caliper for external, internal, and depth dimension measurements.',
        'Measuring Range: 0-150 mm; Least Count: 0.02 mm; Accuracy: +/- 0.03 mm; Thumb clamp lock'
    ),
    (
        '30000000-0000-0000-0000-000000000010', 'EQ-PHY-SCR-01',
        'Mitutoyo Outside Micrometer Screw Gauge (0.01 mm LC)',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Mitutoyo Corporation', '103-137', 'MIT-SG-7731', 'EXCELLENT', 'AVAILABLE',
        '2023-01-15', 85.00, '2026-01-15',
        'Carbide-tipped spindle outside micrometer with ratchet stop for wire gauge and thin sheet measurements.',
        'Measuring Range: 0-25 mm; Least Count: 0.01 mm; Spindle Face: Carbide-tipped flat 6.5 mm dia'
    ),
    (
        '30000000-0000-0000-0000-000000000011', 'EQ-PHY-NR-01',
        'Newton''s Rings Experimental Apparatus & Microscope Unit',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Kotech Export Instruments', 'KEI-NR-10', 'KOT-NR-1022', 'GOOD', 'AVAILABLE',
        '2022-08-10', 380.00, '2025-08-10',
        'Newton''s rings setup comprising planoconvex lens of 100 cm focal length, optical flat, and 45-degree beam splitter plate.',
        'Lens Curvature Radius: R = 100 cm; Glass Plate: Crown glass optical flat; Travel Scale: 0.01 mm micrometer drum'
    ),
    (
        '30000000-0000-0000-0000-000000000012', 'EQ-PHY-SON-01',
        'Teakwood Sonometer with Resonant Tuning Fork Set',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Scientific Equipment Corp', 'SEC-SN-40', 'SEC-SN-3041', 'FAIR', 'AVAILABLE',
        '2021-03-20', 140.00, '2024-03-20',
        'Hollow teakwood resonance soundbox with metric scale, brass movable bridges, pulley, and 0.5 kg weight hanger set.',
        'Length: 1000 mm; Wire: Steel and brass piano wire; Tuning Forks: 256 Hz, 288 Hz, 320 Hz, 384 Hz, 512 Hz set'
    ),
    (
        '30000000-0000-0000-0000-000000000013', 'EQ-PHY-DIO-01',
        'Semiconductor Bandgap & PN Diode Energy Gap Kit',
        '20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
        'Omega Electronics', 'OM-ENG-04', 'OMG-EG-5502', 'FAIR', 'UNDER_MAINTENANCE',
        '2022-04-14', 190.00, '2025-04-14',
        'Educational apparatus for calculating semiconductor energy bandgap Eg via reverse saturation current temperature dependence.',
        'Oven Temp Range: Ambient to 100C; Microammeter: 0-100 uA; Power: Regulated variable DC supply 0-5V'
    ),

    -- ── Engineering Chemistry (CHM-101) ──
    (
        '30000000-0000-0000-0000-000000000014', 'EQ-CHM-BAL-01',
        'Sartorius Precision Analytical Digital Balance (0.1 mg)',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        'Sartorius Lab Instruments', 'Entris II BCE224-1S', 'SAR-ENT-2241', 'EXCELLENT', 'AVAILABLE',
        '2024-02-10', 1250.00, '2027-02-10',
        'High-precision analytical balance with glass draft shield for quantitative chemical weighing and standard solution preparation.',
        'Capacity: 220 g; Readability: 0.1 mg; Linearity: 0.2 mg; Pan Size: 90 mm diameter stainless steel'
    ),
    (
        '30000000-0000-0000-0000-000000000015', 'EQ-CHM-PHM-01',
        'Digital Microprocessor pH Meter with Combined Glass Electrode',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        'Eutech Instruments', 'pH 700 Benchtop', 'EUT-PH-7001', 'GOOD', 'AVAILABLE',
        '2023-09-05', 340.00, '2026-09-05',
        'Benchtop pH and millivolt meter with automatic temperature compensation (ATC) for acid-base potentiometric titrations.',
        'pH Range: -2.00 to 16.00 pH; Resolution: 0.01 pH; mV Range: +/- 2000 mV; Calibration: Up to 5 points'
    ),
    (
        '30000000-0000-0000-0000-000000000016', 'EQ-CHM-VIS-01',
        'Ostwald Viscometer Assembly with Constant Temp Water Bath',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        'J-Sil Borosilicate Instruments', 'J-VIS-25', 'JSIL-VIS-802', 'GOOD', 'AVAILABLE',
        '2022-10-18', 210.00, '2025-10-18',
        'Borosilicate glass Ostwald U-tube viscometer with circulating thermostatic bath and digital stopwatch for fluid viscosity practicals.',
        'Capillary Bore: 0.5 mm dia; Bath Temp Range: Ambient to 80C (+/- 0.1C stability); Timer Resolution: 0.01 s'
    ),
    (
        '30000000-0000-0000-0000-000000000017', 'EQ-CHM-TIT-01',
        'Digital Bottle-Top Titration Station with PTFE Piston',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        'Brand GmbH', 'Titrette 50 mL', 'BRD-TIT-5002', 'EXCELLENT', 'AVAILABLE',
        '2023-11-12', 580.00, '2026-11-12',
        'Class A accuracy bottle-top digital burette for precise volumetric determination of water total hardness (EDTA method).',
        'Volume: 50 mL; Resolution: 0.002 mL (2 uL); Valve Head: Recirculating purge valve to prevent reagent loss'
    ),
    (
        '30000000-0000-0000-0000-000000000018', 'EQ-CHM-CAL-01',
        'Parr Isoperibol Oxygen Bomb Calorimeter',
        '20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002',
        'Parr Instrument Company', 'Parr 1341 Plain Jacket', 'PAR-CAL-1341', 'FAIR', 'UNDER_MAINTENANCE',
        '2021-08-30', 2100.00, '2024-08-30',
        'Static jacket oxygen bomb calorimeter for calorific value determination of solid and liquid coal/fuel samples.',
        'Bomb Vessel: Acid-resistant alloy 342 mL; Oxygen Fill: 30 atm; Temp Sensor: Digital thermistor probe'
    ),

    -- ── Basic Electrical Engineering (ELE-101) ──
    (
        '30000000-0000-0000-0000-000000000019', 'EQ-ELE-DMM-01',
        'Fluke 115 True-RMS Digital Multimeter Workstation #01',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'Fluke Corporation', 'Fluke 115', 'FLK-115-30101', 'EXCELLENT', 'AVAILABLE',
        '2023-05-18', 215.00, '2026-05-18',
        'True-RMS digital multimeter with CAT III 600V safety rating for electrical theorem verification and current measurements.',
        'Voltage AC/DC: Up to 600V; Current: 10A continuous; Resistance: 40 MOhm; Capacitance: 10,000 uF'
    ),
    (
        '30000000-0000-0000-0000-000000000020', 'EQ-ELE-DMM-02',
        'Fluke 115 True-RMS Digital Multimeter Workstation #02',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'Fluke Corporation', 'Fluke 115', 'FLK-115-30102', 'GOOD', 'AVAILABLE',
        '2023-05-18', 215.00, '2026-05-18',
        'True-RMS digital multimeter with CAT III 600V safety rating for electrical theorem verification and current measurements.',
        'Voltage AC/DC: Up to 600V; Current: 10A continuous; Resistance: 40 MOhm; Capacitance: 10,000 uF'
    ),
    (
        '30000000-0000-0000-0000-000000000021', 'EQ-ELE-PWR-01',
        'Regulated Dual-Tracking DC Power Supply (0-30V, 5A)',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'Scientific Instruments', 'PS-3005D', 'SCI-PS-3005', 'EXCELLENT', 'AVAILABLE',
        '2023-06-20', 290.00, '2026-06-20',
        'Dual independent linear DC bench power supply with series and parallel tracking modes, short-circuit current limit protection.',
        'Outputs: 2x 0-30V / 0-5A independent + 1x fixed 5V/3A; Ripple: < 1 mVrms; Display: 4-digit LED dual meters'
    ),
    (
        '30000000-0000-0000-0000-000000000022', 'EQ-ELE-RLC-01',
        'Series & Parallel RLC Circuit Resonance Trainer Board',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'Edutek Systems', 'ETS-RLC-01', 'EDU-RLC-9011', 'GOOD', 'AVAILABLE',
        '2022-09-12', 175.00, '2025-09-12',
        'Modular experimental trainer for investigation of quality factor (Q), bandwidth, and resonance frequency in AC circuits.',
        'Inductors: 10 mH, 20 mH, 50 mH; Capacitors: 0.01 uF to 0.47 uF; Resistors: 10 Ohm to 10 kOhm switched decades'
    ),
    (
        '30000000-0000-0000-0000-000000000023', 'EQ-ELE-WTT-01',
        'Digital Single-Phase Dynamometer Wattmeter (0-1500W)',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'Yokogawa Electric Corp', 'WT310E', 'YOK-WT-3101', 'GOOD', 'AVAILABLE',
        '2023-03-10', 480.00, '2026-03-10',
        'Precision digital power meter for single-phase power, reactive power, power factor, and harmonic measurements.',
        'Voltage Range: 15V to 600V; Current Range: 5 mA to 20A; Basic Accuracy: 0.1% reading; Frequency: DC, 0.5 Hz to 100 kHz'
    ),
    (
        '30000000-0000-0000-0000-000000000024', 'EQ-ELE-RHE-01',
        'Heavy-Duty Wire-Wound Toroidal Rheostat (50 Ohm, 5A)',
        '20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003',
        'National Instruments Corp', 'RH-50-5', 'NIC-RH-5005', 'FAIR', 'AVAILABLE',
        '2021-02-15', 95.00, '2024-02-15',
        'Oxidized eureka wire wound on ceramic tube with brass sliding contact for resistive loading and DC circuit control.',
        'Resistance: 50 Ohm; Current Rating: 5.0 A continuous; Slider: Self-cleaning phosphor bronze contact'
    ),

    -- ── Basic Electronics (ECE-101) ──
    (
        '30000000-0000-0000-0000-000000000025', 'EQ-ECE-DSO-02',
        'Tektronix 50MHz Dual-Channel Digital Storage Oscilloscope #02',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Tektronix Inc.', 'TBS1052B-EDU', 'TEK-TBS-5022', 'GOOD', 'AVAILABLE',
        '2024-05-12', 520.00, '2027-05-12',
        'Educational digital storage oscilloscope with 1 GS/s sampling, FFT frequency analysis, and automated wave parameter measurement cursors.',
        'Bandwidth: 50 MHz; Channels: 2; Sample Rate: 1.0 GS/s per channel; Record Length: 2.5k points; 7-inch WVGA color display'
    ),
    (
        '30000000-0000-0000-0000-000000000026', 'EQ-ECE-FGN-01',
        'Rigol 25MHz Dual-Channel Arbitrary Function Generator',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Rigol Technologies', 'DG1022Z', 'RGL-DG-10221', 'EXCELLENT', 'AVAILABLE',
        '2023-10-25', 410.00, '2026-10-25',
        'DDS function generator providing sine, square, ramp, pulse, and custom arbitrary waveforms for filter and diode testing.',
        'Max Frequency: 25 MHz; Channels: 2; Sample Rate: 200 MSa/s; Waveforms: Sine, Square, Triangle, Noise, Arbitrary'
    ),
    (
        '30000000-0000-0000-0000-000000000027', 'EQ-ECE-DIO-01',
        'PN Junction & Zener Diode Characteristic Trainer Board',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Scientech Technologies', 'Scientech 2151', 'SCI-DIO-2151', 'GOOD', 'AVAILABLE',
        '2022-11-05', 160.00, '2025-11-05',
        'Integrated training module containing silicon, germanium, and Zener diodes with on-board voltage divider and current meters.',
        'Components: 1N4007 (Si), 1N34A (Ge), 1N4733 (5.1V Zener); DC Meters: 0-15V voltmeter, 0-25mA / 0-250uA ammeter'
    ),
    (
        '30000000-0000-0000-0000-000000000028', 'EQ-ECE-TRN-01',
        'BJT & Field Effect Transistor Characteristic Apparatus',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Scientech Technologies', 'Scientech 2153', 'SCI-BJT-2153', 'GOOD', 'IN_USE',
        '2022-11-05', 185.00, '2025-11-05',
        'Complete trainer for plotting Common Base (CB) and Common Emitter (CE) input/output curves for NPN and PNP silicon transistors.',
        'Transistors: BC547 (NPN), BC557 (PNP), BFW10 (JFET); Variable Dual DC Supplies: 0-2V and 0-15V on-board'
    ),
    (
        '30000000-0000-0000-0000-000000000029', 'EQ-ECE-LOG-01',
        'Digital Logic Gate & Boolean Algebra Verification Trainer',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Edutek Systems', 'ETS-DIG-08', 'EDU-LOG-4411', 'EXCELLENT', 'AVAILABLE',
        '2023-08-19', 220.00, '2026-08-19',
        'Digital breadboard platform with built-in clock generator, logic level switches, output LEDs, and 74-series TTL logic IC sockets.',
        'Sockets: 8x 14/16-pin ZIF; Logic Switches: 8x debounced high/low; Display: 8x logic status LEDs + 2-digit 7-segment'
    ),
    (
        '30000000-0000-0000-0000-000000000030', 'EQ-ECE-SLD-01',
        'Weller Temperature-Controlled Soldering Station Unit',
        '20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004',
        'Weller Tools GmbH', 'WT 1010 Set', 'WEL-SLD-1010', 'FAIR', 'UNDER_MAINTENANCE',
        '2021-04-10', 310.00, '2024-04-10',
        'Microprocessor-controlled 90W soldering iron station with fast thermal recovery and ESD-safe silicone cable.',
        'Power: 90W; Temperature Range: 150C to 450C; Heat-up Time: 28 sec to 350C; Tip Series: WTP 90 chisel/conical'
    ),

    -- ── Engineering Workshop (WKS-101) ──
    (
        '30000000-0000-0000-0000-000000000031', 'EQ-WKS-VIC-01',
        'Heavy-Duty Swivel Base Cast Iron Bench Vice (150 mm) #01',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
        'Grovers Precision Tools', 'BV-150-HD', 'GRV-BV-1501', 'GOOD', 'AVAILABLE',
        '2022-01-20', 125.00, '2027-01-20',
        'Robust cast ductile-iron bench vice with serrated hardened carbon steel jaws and 360-degree swivel locking base.',
        'Jaw Width: 150 mm; Maximum Jaw Opening: 165 mm; Clamping Force: 35 kN; Anvil: Integrated flat polished anvil'
    ),
    (
        '30000000-0000-0000-0000-000000000032', 'EQ-WKS-VIC-02',
        'Heavy-Duty Swivel Base Cast Iron Bench Vice (150 mm) #02',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
        'Grovers Precision Tools', 'BV-150-HD', 'GRV-BV-1502', 'GOOD', 'AVAILABLE',
        '2022-01-20', 125.00, '2027-01-20',
        'Robust cast ductile-iron bench vice with serrated hardened carbon steel jaws and 360-degree swivel locking base.',
        'Jaw Width: 150 mm; Maximum Jaw Opening: 165 mm; Clamping Force: 35 kN; Anvil: Integrated flat polished anvil'
    ),
    (
        '30000000-0000-0000-0000-000000000033', 'EQ-WKS-FIT-01',
        'Master Fitting & Metal Finishing Tool Kit Set',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
        'Taparia Tools Ltd', 'FTS-24', 'TAP-FIT-2401', 'GOOD', 'AVAILABLE',
        '2022-06-15', 180.00, '2025-06-15',
        'Comprehensive bench fitting set including flat, half-round, triangular bastard files, scriber, dot punch, and try square.',
        'Files: 10-inch Flat/Half-Round/Triangular; Punch: 60-degree dot punch; Square: 150 mm hardened engineer''s try square'
    ),
    (
        '30000000-0000-0000-0000-000000000034', 'EQ-WKS-SHM-01',
        'Sheet Metal Hand Shear & Snips Forming Tool Set',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
        'Stanley Black & Decker', 'FatMax Aviation Set', 'STN-SHM-4011', 'FAIR', 'AVAILABLE',
        '2021-10-10', 95.00, '2024-10-10',
        'Compound action aviation snips (straight, left, right cut) with wooden mallet and stakes for sheet metal fabrication.',
        'Cutting Capacity: Up to 18-gauge cold rolled steel / 22-gauge stainless steel; Mallet: Seasoned beechwood 75 mm head'
    ),
    (
        '30000000-0000-0000-0000-000000000035', 'EQ-WKS-CAR-01',
        'Carpentry Precision Joinery & Tenon Saw Tool Station',
        '20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005',
        'Stanley Black & Decker', 'Bailey No. 4 Joiner', 'STN-CAR-5021', 'GOOD', 'AVAILABLE',
        '2022-03-25', 145.00, '2025-03-25',
        'Woodworking bench toolset with jack plane, tenon saw, mortise gauge, firmer chisels, and rasp files for lap/mortise practicals.',
        'Plane: No. 4 smoothing jack plane; Saw: 250 mm brass back tenon saw (13 TPI); Chisels: 6 mm, 12 mm, 18 mm, 25 mm set'
    ),

    -- ── Computer Laboratory (CSL-101) ──
    (
        '30000000-0000-0000-0000-000000000036', 'EQ-CSL-PC-02',
        'Dell OptiPlex 7090 Core i7 Programming Workstation #02',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Dell Technologies', 'OptiPlex 7090 MT', 'DELL-OPT-70902', 'EXCELLENT', 'AVAILABLE',
        '2023-04-22', 980.00, '2026-04-22',
        'Undergraduate programming workstation configured with GCC, Clang, Python 3, OpenJDK 21, Git, and VS Code for curriculum practicals.',
        'CPU: Intel Core i7-11700 (8C/16T, up to 4.9 GHz); RAM: 16 GB DDR4; SSD: 512 GB NVMe; OS: Ubuntu 22.04 LTS / Windows 11 Pro Dual-Boot'
    ),
    (
        '30000000-0000-0000-0000-000000000037', 'EQ-CSL-PC-03',
        'Dell OptiPlex 7090 Core i7 Programming Workstation #03',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Dell Technologies', 'OptiPlex 7090 MT', 'DELL-OPT-70903', 'GOOD', 'IN_USE',
        '2023-04-22', 980.00, '2026-04-22',
        'Undergraduate programming workstation configured with GCC, Clang, Python 3, OpenJDK 21, Git, and VS Code for curriculum practicals.',
        'CPU: Intel Core i7-11700 (8C/16T, up to 4.9 GHz); RAM: 16 GB DDR4; SSD: 512 GB NVMe; OS: Ubuntu 22.04 LTS / Windows 11 Pro Dual-Boot'
    ),
    (
        '30000000-0000-0000-0000-000000000038', 'EQ-CSL-PC-04',
        'Dell OptiPlex 7090 Core i7 Programming Workstation #04',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Dell Technologies', 'OptiPlex 7090 MT', 'DELL-OPT-70904', 'GOOD', 'AVAILABLE',
        '2023-04-22', 980.00, '2026-04-22',
        'Undergraduate programming workstation configured with GCC, Clang, Python 3, OpenJDK 21, Git, and VS Code for curriculum practicals.',
        'CPU: Intel Core i7-11700 (8C/16T, up to 4.9 GHz); RAM: 16 GB DDR4; SSD: 512 GB NVMe; OS: Ubuntu 22.04 LTS / Windows 11 Pro Dual-Boot'
    ),
    (
        '30000000-0000-0000-0000-000000000039', 'EQ-CSL-PC-05',
        'Dell OptiPlex 7090 Core i7 Programming Workstation #05',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Dell Technologies', 'OptiPlex 7090 MT', 'DELL-OPT-70905', 'FAIR', 'UNDER_MAINTENANCE',
        '2023-04-22', 980.00, '2026-04-22',
        'Undergraduate programming workstation configured with GCC, Clang, Python 3, OpenJDK 21, Git, and VS Code for curriculum practicals.',
        'CPU: Intel Core i7-11700 (8C/16T, up to 4.9 GHz); RAM: 16 GB DDR4; SSD: 512 GB NVMe; OS: Ubuntu 22.04 LTS / Windows 11 Pro Dual-Boot'
    ),
    (
        '30000000-0000-0000-0000-000000000040', 'EQ-CSL-SWT-01',
        'Cisco Catalyst 24-Port Gigabit Managed Laboratory Switch',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Cisco Systems Inc.', 'Catalyst 1000-24T', 'CSCO-CAT-1024', 'EXCELLENT', 'AVAILABLE',
        '2023-06-15', 720.00, '2026-06-15',
        'High-density 24-port Layer 2 managed Ethernet switch providing isolated student VLAN networking and DHCP distribution.',
        'Ports: 24x 10/100/1000Base-T RJ45 + 4x 1G SFP; Switching Capacity: 56 Gbps; Forwarding: 41.67 Mpps'
    ),
    (
        '30000000-0000-0000-0000-000000000041', 'EQ-CSL-UPS-01',
        'APC Smart-UPS 3000VA Online Central Power Backup',
        '20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006',
        'Schneider Electric / APC', 'SRT3000XLI', 'APC-SRT-3001', 'GOOD', 'AVAILABLE',
        '2023-01-20', 1450.00, '2026-01-20',
        'Pure sine wave double-conversion online UPS providing uninterrupted power and surge suppression to computing lab nodes.',
        'Output Power: 3000 VA / 2700 Watts; Nominal Voltage: 230V AC; Battery: Maintenance-free sealed lead-acid'
    )
ON CONFLICT (asset_tag) DO UPDATE SET
    name = EXCLUDED.name,
    category_id = EXCLUDED.category_id,
    laboratory_id = EXCLUDED.laboratory_id,
    manufacturer = EXCLUDED.manufacturer,
    model = EXCLUDED.model,
    serial_number = EXCLUDED.serial_number,
    condition = EXCLUDED.condition,
    status = EXCLUDED.status,
    purchase_date = EXCLUDED.purchase_date,
    purchase_cost = EXCLUDED.purchase_cost,
    warranty_expiration = EXCLUDED.warranty_expiration,
    description = EXCLUDED.description,
    specifications = EXCLUDED.specifications;

-- 7. Seed Representative First-Year B.Tech Teaching Experiments (19 experiments)
INSERT INTO teaching_experiments (
    id, code, title, subject, objective, description, laboratory_id, manual_reference, active
)
VALUES 
    -- ── Physics Experiments ──
    (
        '60000000-0000-0000-0000-000000000001', 'EXP-PHY-01',
        'Measurement of Dimensions & Volume using Vernier Calipers and Micrometer Screw Gauge',
        'Engineering Physics',
        'To determine the volume of a solid/hollow cylinder and diameter of a thin wire by calculating instrumental least count and zero error.',
        'Students master precision metrology tools by taking orthogonal measurements of machined metal test pieces, accounting for positive and negative zero errors.',
        '10000000-0000-0000-0000-000000000001', 'Physics Lab Manual Experiment 01, pp. 4-9', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000002', 'EXP-PHY-02',
        'Determination of Wavelength of Sodium Light by Newton''s Rings Method',
        'Engineering Physics',
        'To observe circular interference fringes produced by thin air film and measure the wavelength of monochromatic sodium D-lines.',
        'Light reflected between a plano-convex lens and optical flat generates circular concentric interference rings. The difference of the squares of ring diameters yields the sodium wavelength.',
        '10000000-0000-0000-0000-000000000001', 'Physics Lab Manual Experiment 03, pp. 16-22', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000003', 'EXP-PHY-03',
        'Measurement of Refractive Index and Dispersive Power using Optical Bench & Biprism',
        'Engineering Physics',
        'To produce optical interference using a Fresnel biprism and calculate fringe width, refractive index, and optical dispersion.',
        'The sodium source passes through an adjustable slit and biprism on the two-meter optical bench. Fringe widths are measured with the micrometer eyepiece carriage.',
        '10000000-0000-0000-0000-000000000001', 'Physics Lab Manual Experiment 05, pp. 28-34', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000004', 'EXP-PHY-04',
        'Verification of Laws of Transverse Vibrations of Stretched Strings using Sonometer',
        'Engineering Physics',
        'To verify the relation between resonant frequency, vibrating length, and wire tension using standardized tuning forks.',
        'A steel wire under hanging tension is set into resonance by vibrating tuning forks. A lightweight paper rider demonstrates maximum vibration amplitude at anti-nodes.',
        '10000000-0000-0000-0000-000000000001', 'Physics Lab Manual Experiment 07, pp. 41-47', TRUE
    ),

    -- ── Chemistry Experiments ──
    (
        '60000000-0000-0000-0000-000000000005', 'EXP-CHM-01',
        'Determination of Total, Permanent, and Temporary Hardness of Water by EDTA Method',
        'Engineering Chemistry',
        'To estimate calcium and magnesium ion hardness in boiler feedwater samples using complexometric EDTA titration.',
        'Standard disodium EDTA solution is titrated against buffered water samples at pH 10 using Eriochrome Black T indicator, observing the sharp wine-red to sky-blue endpoint.',
        '10000000-0000-0000-0000-000000000002', 'Chemistry Lab Manual Experiment 01, pp. 3-8', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000006', 'EXP-CHM-02',
        'Determination of Strength of Hydrochloric Acid using pH Metric Titration',
        'Engineering Chemistry',
        'To determine the concentration of a strong acid by recording pH progression upon incremental addition of standard sodium hydroxide.',
        'A combined glass calomel electrode continuously monitors solution pH. The equivalence point is computed from the maximum rate of change (first derivative curve dpH/dV).',
        '10000000-0000-0000-0000-000000000002', 'Chemistry Lab Manual Experiment 03, pp. 15-20', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000007', 'EXP-CHM-03',
        'Conductometric Titration of Strong Acid against Strong Base',
        'Engineering Chemistry',
        'To determine the equivalence point of HCl versus NaOH titration without chemical indicators by measuring electrolytic conductance.',
        'Conductance decreases sharply as fast-moving hydrogen ions (H+) are neutralized, then climbs after the equivalence point as excess hydroxyl ions (OH-) are added.',
        '10000000-0000-0000-0000-000000000002', 'Chemistry Lab Manual Experiment 04, pp. 21-26', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000008', 'EXP-CHM-04',
        'Determination of Coefficient of Viscosity of Lubricating Liquids using Ostwald Viscometer',
        'Engineering Chemistry',
        'To calculate the relative and dynamic viscosity of organic liquid lubricants at constant temperature.',
        'The flow time of a fixed liquid volume through the viscometer capillary tube is timed in a constant-temperature bath and compared against deionized reference water.',
        '10000000-0000-0000-0000-000000000002', 'Chemistry Lab Manual Experiment 06, pp. 33-38', TRUE
    ),

    -- ── Electrical Experiments ──
    (
        '60000000-0000-0000-0000-000000000009', 'EXP-ELE-01',
        'Verification of Kirchhoff''s Current Law (KCL) and Voltage Law (KVL) in Resistive Networks',
        'Basic Electrical Engineering',
        'To experimentally verify KCL and KVL in multi-loop planar resistive bridge circuits powered by regulated DC sources.',
        'Branch currents and node potentials are measured using digital multimeters and compared against theoretical values calculated from nodal and mesh analysis equations.',
        '10000000-0000-0000-0000-000000000003', 'Electrical Engineering Manual Experiment 01, pp. 5-11', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000010', 'EXP-ELE-02',
        'Measurement of Resonant Frequency, Bandwidth, and Quality Factor in Series RLC Circuit',
        'Basic Electrical Engineering',
        'To observe AC series resonance, plot the current-frequency response curve, and calculate the quality factor (Q).',
        'A variable-frequency sinusoidal generator excites the series RLC branch. Maximum circuit current occurs at the natural resonant frequency fr = 1 / (2 * pi * sqrt(L * C)).',
        '10000000-0000-0000-0000-000000000003', 'Electrical Engineering Manual Experiment 04, pp. 22-28', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000011', 'EXP-ELE-03',
        'Open-Circuit (OC) and Short-Circuit (SC) Tests on Single-Phase Transformer',
        'Basic Electrical Engineering',
        'To determine core losses, copper losses, equivalent circuit parameters, and efficiency of a single-phase transformer.',
        'The OC test at rated primary voltage yields iron loss and magnetizing branch parameters; the SC test at rated current yields series copper loss and leakage reactance.',
        '10000000-0000-0000-0000-000000000003', 'Electrical Engineering Manual Experiment 06, pp. 35-42', TRUE
    ),

    -- ── Electronics Experiments ──
    (
        '60000000-0000-0000-0000-000000000012', 'EXP-ECE-01',
        'Familiarization with Digital Storage Oscilloscope (DSO) and Function Generator',
        'Basic Electronics',
        'To measure peak-to-peak voltage, frequency, time period, and phase difference of various test waveforms.',
        'Students configure DSO vertical volts/div, horizontal sec/div, trigger modes, and use automated cursor menus to evaluate sinusoidal, square, and triangular test signals.',
        '10000000-0000-0000-0000-000000000004', 'Electronics Lab Manual Experiment 01, pp. 4-10', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000013', 'EXP-ECE-02',
        'Forward and Reverse Bias Characteristics of PN Junction Diode and Zener Voltage Regulator',
        'Basic Electronics',
        'To plot static V-I curves for silicon/germanium diodes and evaluate Zener breakdown voltage regulation under varying load.',
        'Forward knee voltage (0.7V for Si, 0.3V for Ge) and steep reverse breakdown are plotted point-by-point with regulated DC sources and current meters.',
        '10000000-0000-0000-0000-000000000004', 'Electronics Lab Manual Experiment 02, pp. 11-18', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000014', 'EXP-ECE-03',
        'Input and Output Characteristics of BJT in Common Emitter (CE) Configuration',
        'Basic Electronics',
        'To plot input curves (IB vs VBE) and output curves (IC vs VCE) and determine current gain (beta) and hybrid parameters.',
        'Base current is kept constant while collector voltage is stepped. Output saturation, active, and cutoff regions are identified and analyzed.',
        '10000000-0000-0000-0000-000000000004', 'Electronics Lab Manual Experiment 04, pp. 25-32', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000015', 'EXP-ECE-04',
        'Verification of Truth Tables of Basic Logic Gates and Realization using Universal Gates',
        'Basic Electronics',
        'To verify truth tables for AND, OR, NOT, NAND, NOR, and XOR gates using 74-series TTL integrated circuits.',
        'Logic high and low inputs are toggled via debounced switches, and logic outputs are read from status LED indicators to verify Boolean theorems.',
        '10000000-0000-0000-0000-000000000004', 'Electronics Lab Manual Experiment 06, pp. 39-45', TRUE
    ),

    -- ── Workshop Experiments ──
    (
        '60000000-0000-0000-0000-000000000016', 'EXP-WKS-01',
        'Fabrication of Square and Stepped Lap Joint in Mild Steel Flat Workpiece by Bench Fitting',
        'Engineering Workshop',
        'To practice measuring, marking, hacksawing, and filing mild steel flats to achieve accurate perpendicular fit within +/- 0.2 mm.',
        'Students clamp mild steel workpieces in bench vices, mark layout dimensions with dot punch and scriber, perform rough hacksaw cuts, and finish with bastard and smooth files.',
        '10000000-0000-0000-0000-000000000005', 'Workshop Practice Manual Chapter 2 (Fitting), pp. 12-18', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000017', 'EXP-WKS-02',
        'Drilling, Countersinking, and Internal Thread Tapping on Mild Steel Plate',
        'Engineering Workshop',
        'To drill pilot and clearance holes on mild steel using a bench pillar drill and tap internal threads using hand tap sets.',
        'Center punch marks guide the pillar drill spindle. Cutting lubricant is applied, followed by intermediate and plug taps rotated with hand tap wrenches.',
        '10000000-0000-0000-0000-000000000005', 'Workshop Practice Manual Chapter 3 (Machining), pp. 22-27', TRUE
    ),

    -- ── Computer Programming Experiments ──
    (
        '60000000-0000-0000-0000-000000000018', 'EXP-CSL-01',
        'Implementation of Numerical Algorithms, Conditionals, and Iterative Loops in C/Python',
        'Computer Programming',
        'To develop, compile, and execute algorithmic programs for prime factorization, matrix arithmetic, and Taylor series expansion.',
        'Students write structured modular code in POSIX Linux environments using GCC and Python 3, verifying algorithmic complexity and edge-case boundary conditions.',
        '10000000-0000-0000-0000-000000000006', 'Programming Lab Manual Unit 1, pp. 5-14', TRUE
    ),
    (
        '60000000-0000-0000-0000-000000000019', 'EXP-CSL-02',
        'Pointers, Dynamic Memory Allocation, and File Handling Operations in C',
        'Computer Programming',
        'To implement dynamic linked lists, string manipulation with pointers, and formatted binary record storage on disk.',
        'Students implement pointer arithmetic and memory management functions (malloc, calloc, realloc, free), debugging memory leaks with Valgrind under Linux.',
        '10000000-0000-0000-0000-000000000006', 'Programming Lab Manual Unit 3, pp. 25-36', TRUE
    )
ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    subject = EXCLUDED.subject,
    objective = EXCLUDED.objective,
    description = EXCLUDED.description,
    laboratory_id = EXCLUDED.laboratory_id,
    manual_reference = EXCLUDED.manual_reference,
    active = EXCLUDED.active;

-- 8. Connect Teaching Experiments to Equipment in Junction Table (experiment_equipment)
INSERT INTO experiment_equipment (experiment_id, equipment_id)
VALUES 
    -- EXP-PHY-01: Vernier & Screw Gauge
    ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000009'),
    ('60000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000010'),

    -- EXP-PHY-02: Newton's Rings & Travelling Microscope
    ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000011'),
    ('60000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001'),

    -- EXP-PHY-03: Optical Bench & Travelling Microscope
    ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000002'),
    ('60000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001'),

    -- EXP-PHY-04: Sonometer
    ('60000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000012'),

    -- EXP-CHM-01: Analytical Balance & Titration Station
    ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000014'),
    ('60000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000017'),

    -- EXP-CHM-02: pH Meter & Magnetic Stirrer
    ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000015'),
    ('60000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000003'),

    -- EXP-CHM-03: Conductivity Meter & Magnetic Stirrer
    ('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000004'),
    ('60000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000003'),

    -- EXP-CHM-04: Viscometer & Analytical Balance
    ('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000016'),
    ('60000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000014'),

    -- EXP-ELE-01: Multimeter & DC Power Supply
    ('60000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000019'),
    ('60000000-0000-0000-0000-000000000009', '30000000-0000-0000-0000-000000000021'),

    -- EXP-ELE-02: RLC Trainer, Multimeter & Function Generator
    ('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000022'),
    ('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000020'),
    ('60000000-0000-0000-0000-000000000010', '30000000-0000-0000-0000-000000000026'),

    -- EXP-ELE-03: Transformer Trainer, Wattmeter & Rheostat
    ('60000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000005'),
    ('60000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000023'),
    ('60000000-0000-0000-0000-000000000011', '30000000-0000-0000-0000-000000000024'),

    -- EXP-ECE-01: DSO & Function Generator
    ('60000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000006'),
    ('60000000-0000-0000-0000-000000000012', '30000000-0000-0000-0000-000000000026'),

    -- EXP-ECE-02: Diode Trainer, DC Power Supply & Multimeter
    ('60000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000027'),
    ('60000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000021'),
    ('60000000-0000-0000-0000-000000000013', '30000000-0000-0000-0000-000000000019'),

    -- EXP-ECE-03: Transistor Trainer & DSO #02
    ('60000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000028'),
    ('60000000-0000-0000-0000-000000000014', '30000000-0000-0000-0000-000000000025'),

    -- EXP-ECE-04: Digital Logic Gate Trainer
    ('60000000-0000-0000-0000-000000000015', '30000000-0000-0000-0000-000000000029'),

    -- EXP-WKS-01: Swivel Bench Vice #01, Fitting Tool Kit & Vernier Caliper
    ('60000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000031'),
    ('60000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000033'),
    ('60000000-0000-0000-0000-000000000016', '30000000-0000-0000-0000-000000000009'),

    -- EXP-WKS-02: Bench Pillar Drill & Bench Vice #02
    ('60000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000007'),
    ('60000000-0000-0000-0000-000000000017', '30000000-0000-0000-0000-000000000032'),

    -- EXP-CSL-01: Programming Workstations #01, #02, #03
    ('60000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000008'),
    ('60000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000036'),
    ('60000000-0000-0000-0000-000000000018', '30000000-0000-0000-0000-000000000037'),

    -- EXP-CSL-02: Workstation #04 & Network Switch
    ('60000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000038'),
    ('60000000-0000-0000-0000-000000000019', '30000000-0000-0000-0000-000000000040')
ON CONFLICT (experiment_id, equipment_id) DO NOTHING;
