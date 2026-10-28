import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  Layers,
  CalendarRange,
  Wrench,
  FileCheck2,
  CheckCircle,
} from 'lucide-react';

export const Features: React.FC = () => {
  const features = [
    {
      id: 'equipment',
      badge: 'INVENTORY & ASSETS',
      icon: Layers,
      title: 'Precision Equipment Catalog & Facility Mapping',
      description:
        'A unified, authoritative registry for every university instrument across departments. From electron microscopes to CNC mills, track models, serial numbers, manuals, and physical lab locations.',
      highlights: [
        'Hierarchical laboratory and category taxonomy',
        'Real-time status: Available, In-Use, Maintenance, Calibration',
        'Prerequisite safety certification enforcement before booking',
        'Digital manual attachments & technical specification sheets',
      ],
      tag: 'Module 02',
    },
    {
      id: 'reservations',
      badge: 'SCHEDULING ENGINE',
      icon: CalendarRange,
      title: 'Conflict-Free Reservations via Half-Open Intervals',
      description:
        'Eliminate double-booking disputes. Modeled rigorously as [start, end) intervals and protected at the PostgreSQL database engine level using GiST range exclusion constraints.',
      highlights: [
        'Adjacent slots [10:00, 11:00) and [11:00, 12:00) never collide',
        'PostgreSQL btree_gist exclusion constraints prevent race conditions',
        'Pessimistic row locking during checkout and booking confirmation',
        'Operator certification verification prior to slot confirmation',
      ],
      tag: 'Module 03',
    },
    {
      id: 'maintenance',
      badge: 'LIFECYCLE & REPAIRS',
      icon: Wrench,
      title: 'Reactive Fault Triage & Work Order Orchestration',
      description:
        'Turn researcher issue reports into structured technician dispatches. Critical fault tickets automatically lock instruments from public booking until certified return-to-service.',
      highlights: [
        'Automated state transition to UNDER_MAINTENANCE on critical faults',
        'Work order assignment to lab technicians with priority tiers',
        'Spare parts consumption and labor cost tracking using BigDecimal',
        'Scheduled preventive calibration routines with automated reminders',
      ],
      tag: 'Module 04',
    },
    {
      id: 'audit',
      badge: 'GOVERNANCE & ANALYTICS',
      icon: FileCheck2,
      title: 'Immutable Audit Trail & Utilization Intelligence',
      description:
        'Satisfy university grant compliance and safety inspections. Every administrative action, booking change, and maintenance sign-off is preserved in an append-only log.',
      highlights: [
        'Tamper-evident audit log with actor ID, timestamp, and state diffs',
        'Mean Time Between Failures (MTBF) and MTTR tracking',
        'Departmental utilization rates and peak-demand heatmaps',
        'Exportable CSV and PDF compliance reports for grant audits',
      ],
      tag: 'Module 05 & 06',
    },
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge variant="lime" className="text-xs uppercase font-mono tracking-wider">
            Domain Capabilities
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Engineered for High-Stakes Academic Facilities
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Generic calendar tools fail when multi-million dollar instruments, toxic solvents, and strict safety protocols are involved. LabLedger is purpose-built for scientific workflows.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="rounded-lg border border-border bg-card p-8 shadow-card hover:border-border transition-all flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Top Meta */}
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-md bg-muted/60 border border-border flex items-center justify-center text-foreground">
                      <Icon className="w-5 h-5 text-foreground" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {feature.tag}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl font-bold text-foreground tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Bullet Highlights */}
                  <ul className="space-y-2.5 pt-4 border-t border-border/60">
                    {feature.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground/90 font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-accent-lime shrink-0 mt-0.5" />
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-border/40 flex items-center justify-between text-xs font-mono text-muted-foreground">
                  <span className="uppercase tracking-wider">{feature.badge}</span>
                  <span className="text-accent-lime">&rarr; INVARIANT ENFORCED</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
