import React, { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  PreviewEquipmentItem,
  PreviewReservation,
  PreviewWorkOrder,
} from '@/types/preview';
import {
  Search,
  Filter,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Info,
  Building2,
  Tag,
  ShieldAlert,
} from 'lucide-react';

const SAMPLE_EQUIPMENT: PreviewEquipmentItem[] = [
  {
    id: 'eq-01',
    assetTag: 'MAT-XRD-402',
    name: 'Rigaku SmartLab X-Ray Diffractometer',
    model: 'SmartLab 9kW',
    category: 'Crystallography',
    labLocation: 'Materials Science Bay B-12',
    status: 'AVAILABLE',
    requiredCertification: 'Radiation Safety Level 2',
    nextSlotTime: 'Today 14:00 UTC',
    healthScore: 98,
  },
  {
    id: 'eq-02',
    assetTag: 'NANO-SEM-108',
    name: 'FEI Quanta 3D FEG DualBeam SEM/FIB',
    model: 'Quanta 3D',
    category: 'Electron Microscopy',
    labLocation: 'Nanofabrication Cleanroom R-04',
    status: 'IN_USE',
    requiredCertification: 'Cleanroom Nanofab Protocol',
    nextSlotTime: 'Occupied until 16:30 UTC',
    healthScore: 94,
  },
  {
    id: 'eq-03',
    assetTag: 'BIO-NMR-600',
    name: 'Bruker Avance III HD 600 MHz Spectrometer',
    model: 'Avance III HD',
    category: 'Spectroscopy',
    labLocation: 'Biochemistry Core C-101',
    status: 'UNDER_MAINTENANCE',
    requiredCertification: 'Cryogen Safety Handling',
    nextSlotTime: 'Suspended (WO #2026-084)',
    healthScore: 61,
  },
  {
    id: 'eq-04',
    assetTag: 'CHEM-HPLC-210',
    name: 'Agilent 1260 Infinity II HPLC System',
    model: 'Infinity II Quaternary',
    category: 'Chromatography',
    labLocation: 'Analytical Chemistry Lab A-09',
    status: 'CALIBRATION_PENDING',
    requiredCertification: 'Hazardous Solvents SOP',
    nextSlotTime: 'Due Calibration at 18:00 UTC',
    healthScore: 89,
  },
  {
    id: 'eq-05',
    assetTag: 'PHYS-SPM-301',
    name: 'Asylum Research Cypher ES AFM',
    model: 'Cypher ES Environmental',
    category: 'Atomic Force Microscopy',
    labLocation: 'Condensed Matter Physics P-22',
    status: 'AVAILABLE',
    requiredCertification: 'AFM Probe Handling Cert',
    nextSlotTime: 'Open for booking',
    healthScore: 100,
  },
];

const SAMPLE_RESERVATIONS: PreviewReservation[] = [
  {
    id: 'res-101',
    equipmentName: 'FEI Quanta 3D FEG DualBeam SEM/FIB',
    assetTag: 'NANO-SEM-108',
    bookedBy: 'Dr. Elena Rostova',
    department: 'Materials Science & Nanoengineering',
    interval: '[13:00, 16:30) UTC',
    status: 'CHECKED_IN',
    purpose: 'Gallium ion milling on perovskite thin film samples',
  },
  {
    id: 'res-102',
    equipmentName: 'Rigaku SmartLab X-Ray Diffractometer',
    assetTag: 'MAT-XRD-402',
    bookedBy: 'Marcus Chen (Grad Researcher)',
    department: 'Chemical Engineering',
    interval: '[17:00, 19:30) UTC',
    status: 'CONFIRMED',
    purpose: 'Grazing incidence XRD on synthetic catalyst electrodes',
  },
  {
    id: 'res-103',
    equipmentName: 'Asylum Research Cypher ES AFM',
    assetTag: 'PHYS-SPM-301',
    bookedBy: 'Prof. David Vance',
    department: 'Applied Physics',
    interval: '[20:00, 22:00) UTC',
    status: 'CONFIRMED',
    purpose: 'Force spectroscopy of lipid bilayer membranes',
  },
];

const SAMPLE_WORK_ORDERS: PreviewWorkOrder[] = [
  {
    id: 'wo-84',
    workOrderNumber: 'WO-2026-084',
    equipmentName: 'Bruker Avance III HD 600 MHz Spectrometer',
    assetTag: 'BIO-NMR-600',
    faultSummary: 'Helium boil-off monitor threshold warning & probe drift',
    severity: 'CRITICAL',
    status: 'IN_PROGRESS',
    assignedTechnician: 'Sarah Jenkins (Cryo Field Specialist)',
    loggedHours: '3.5 hrs (Parts Replaced: Transfer Line Gasket)',
  },
  {
    id: 'wo-85',
    workOrderNumber: 'WO-2026-085',
    equipmentName: 'Agilent 1260 Infinity II HPLC System',
    assetTag: 'CHEM-HPLC-210',
    faultSummary: 'Quarterly pressure transducer recalibration',
    severity: 'MEDIUM',
    status: 'OPEN',
    assignedTechnician: 'Robert Vance (Lab Operations)',
    loggedHours: 'Pending start',
  },
];

export const ProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'reservations' | 'maintenance'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLab, setSelectedLab] = useState<string>('ALL');

  const filteredEquipment = SAMPLE_EQUIPMENT.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesLab = selectedLab === 'ALL' || item.labLocation.includes(selectedLab);
    return matchesSearch && matchesLab;
  });

  const getStatusBadge = (status: PreviewEquipmentItem['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge variant="available" withDot>Available</Badge>;
      case 'IN_USE':
        return <Badge variant="inuse" withDot>In Use</Badge>;
      case 'UNDER_MAINTENANCE':
        return <Badge variant="maintenance" withDot>Maintenance</Badge>;
      case 'CALIBRATION_PENDING':
        return <Badge variant="calibration" withDot>Calibration Due</Badge>;
    }
  };

  return (
    <section id="preview" className="py-20 bg-background border-y border-border/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <Badge variant="lime" className="text-[10px] tracking-wider uppercase font-semibold">
                Simulated Facility Environment
              </Badge>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-accent-lime" />
                Product Preview &bull; Sample Facility Data Only
              </span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Equipment Lifecycle &amp; Availability Console
            </h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Inspect how university researchers browse instrument bays, check real-time availability, schedule non-colliding slots, and monitor reactive work orders.
            </p>
          </div>

          {/* Tab Switchers */}
          <div className="flex items-center p-1 bg-muted/60 rounded-md border border-border" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'inventory'}
              onClick={() => setActiveTab('inventory')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-card text-foreground shadow-subtle font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Instruments ({SAMPLE_EQUIPMENT.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'reservations'}
              onClick={() => setActiveTab('reservations')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'reservations'
                  ? 'bg-card text-foreground shadow-subtle font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Bookings ({SAMPLE_RESERVATIONS.length})
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'maintenance'}
              onClick={() => setActiveTab('maintenance')}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                activeTab === 'maintenance'
                  ? 'bg-card text-foreground shadow-subtle font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Work Orders ({SAMPLE_WORK_ORDERS.length})
            </button>
          </div>
        </div>

        {/* Preview Frame Container */}
        <div className="rounded-lg border border-border bg-card shadow-elevated overflow-hidden">
          {/* Top Preview Bar */}
          <div className="px-5 py-3 border-b border-border bg-muted/30 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-mono font-medium text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                Central Research Infrastructure Bay
              </span>
              <span className="text-muted-foreground/60">|</span>
              <span className="text-muted-foreground font-mono text-[11px]">
                Timezone: <strong className="text-foreground">UTC (Standardized)</strong>
              </span>
            </div>

            {/* Explicit Notice: NOT LIVE DATA */}
            <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground bg-background px-2.5 py-1 rounded border border-border">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
              <span>PREVIEW MODE &bull; NO LIVE PERSISTENCE</span>
            </div>
          </div>

          {/* TAB 1: EQUIPMENT INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="p-5 space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by asset tag, instrument, or category..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <select
                    value={selectedLab}
                    onChange={(e) => setSelectedLab(e.target.value)}
                    aria-label="Filter by laboratory facility"
                    className="text-xs bg-background border border-input rounded-md px-2.5 py-1.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ALL">All Laboratories</option>
                    <option value="Materials Science">Materials Science</option>
                    <option value="Nanofabrication">Nanofabrication</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Chemistry">Analytical Chemistry</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-mono">
                      <th className="py-2.5 px-3 font-medium">Asset &amp; Instrument</th>
                      <th className="py-2.5 px-3 font-medium">Facility Bay</th>
                      <th className="py-2.5 px-3 font-medium">Operating Status</th>
                      <th className="py-2.5 px-3 font-medium">Safety Requirement</th>
                      <th className="py-2.5 px-3 font-medium">Next Available</th>
                      <th className="py-2.5 px-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredEquipment.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="flex items-center gap-2 mt-0.5 font-mono text-[11px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" /> {item.assetTag}
                            </span>
                            <span>&bull;</span>
                            <span>{item.category}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-muted-foreground font-mono text-[11px]">
                          {item.labLocation}
                        </td>
                        <td className="py-3 px-3">
                          {getStatusBadge(item.status)}
                        </td>
                        <td className="py-3 px-3">
                          {item.requiredCertification ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                              <ShieldAlert className="w-3 h-3 text-amber-500" />
                              {item.requiredCertification}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-[11px] font-mono">General Access</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-foreground">
                          {item.nextSlotTime}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            variant={item.status === 'AVAILABLE' ? 'primary' : 'outline'}
                            size="sm"
                            disabled={item.status === 'UNDER_MAINTENANCE'}
                            onClick={() => alert(`Preview demonstration: In Phase 04, this reserves slot on ${item.assetTag}.`)}
                          >
                            {item.status === 'AVAILABLE'
                              ? 'Book Slot'
                              : item.status === 'UNDER_MAINTENANCE'
                              ? 'Locked'
                              : 'View Schedule'}
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE RESERVATIONS */}
          {activeTab === 'reservations' && (
            <div className="p-5 space-y-4">
              <div className="p-3 bg-muted/40 rounded-md border border-border/80 text-xs flex items-center justify-between">
                <span className="font-mono text-muted-foreground">
                  Constraint Engine: <strong className="text-foreground">PostgreSQL btree_gist Exclusion Active</strong>
                </span>
                <span className="font-mono text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Overlap Protection Verified
                </span>
              </div>

              <div className="space-y-3">
                {SAMPLE_RESERVATIONS.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-md border border-border bg-card/70 hover:border-border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{res.equipmentName}</span>
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {res.assetTag}
                        </Badge>
                        <Badge variant={res.status === 'CHECKED_IN' ? 'inuse' : 'available'} withDot>
                          {res.status === 'CHECKED_IN' ? 'Checked In' : 'Confirmed'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {res.purpose}
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground pt-1">
                        Principal: <span className="text-foreground">{res.bookedBy}</span> &bull; {res.department}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right font-mono text-xs">
                        <div className="text-muted-foreground text-[10px]">RESERVATION INTERVAL</div>
                        <div className="font-bold text-foreground text-sm font-tabular">{res.interval}</div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert('Preview mode: Reservation actions will be activated in Phase 04.')}
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MAINTENANCE WORK ORDERS */}
          {activeTab === 'maintenance' && (
            <div className="p-5 space-y-4">
              <div className="p-3 bg-muted/40 rounded-md border border-border/80 text-xs flex items-center justify-between">
                <span className="font-mono text-muted-foreground">
                  Maintenance Policy: <strong className="text-foreground">Critical faults immediately set equipment to UNDER_MAINTENANCE</strong>
                </span>
                <span className="font-mono text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> 1 Critical Incident
                </span>
              </div>

              <div className="space-y-3">
                {SAMPLE_WORK_ORDERS.map((wo) => (
                  <div
                    key={wo.id}
                    className="p-4 rounded-md border border-border bg-card/70 hover:border-border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs font-bold text-foreground">
                          {wo.workOrderNumber}
                        </Badge>
                        <span className="font-semibold text-sm text-foreground">{wo.equipmentName}</span>
                        <Badge variant={wo.severity === 'CRITICAL' ? 'maintenance' : 'calibration'}>
                          {wo.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                        <Wrench className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                        <span>{wo.faultSummary}</span>
                      </p>
                      <div className="text-[11px] font-mono text-muted-foreground pt-1">
                        Assigned: <strong className="text-foreground">{wo.assignedTechnician}</strong> &bull; {wo.loggedHours}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={wo.status === 'IN_PROGRESS' ? 'lime' : 'neutral'}>
                        {wo.status.replace(/_/g, ' ')}
                      </Badge>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => alert('Preview mode: Work order triage will be activated in Phase 05.')}
                      >
                        Inspect Ticket
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="font-mono text-[11px]">
              Schema Engine: Flyway V3 &bull; Interval: Half-Open [start, end) &bull; Zero Entity Exposure
            </span>
            <span className="text-[11px]">
              Simulated demonstration for academic evaluation.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
