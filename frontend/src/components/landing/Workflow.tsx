import React from 'react';
import { Badge } from '@/components/ui/Badge';
import {
  AlertCircle,
  Lock,
  Wrench,
  CheckCheck,
  ArrowRight,
} from 'lucide-react';

export const Workflow: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Fault Discovery & Incident Report',
      actor: 'Student / Researcher',
      icon: AlertCircle,
      description:
        'A researcher notices mechanical drift or an instrument error code during an active session and submits a structured fault ticket detailing symptoms and severity.',
      stateLabel: 'STATUS: FAULT_REPORTED',
      accent: 'border-amber-300 dark:border-amber-800',
    },
    {
      step: '02',
      title: 'Automated Facility Lockdown',
      actor: 'System Invariant Guard',
      icon: Lock,
      description:
        'Critical faults immediately flip instrument status to UNDER_MAINTENANCE. Existing upcoming bookings are notified and new reservations are blocked at the database tier.',
      stateLabel: 'EQUIPMENT LOCKED',
      accent: 'border-rose-300 dark:border-rose-800',
    },
    {
      step: '03',
      title: 'Triage & Work Order Dispatch',
      actor: 'Lab Manager & Technician',
      icon: Wrench,
      description:
        'The lab manager reviews ticket severity, converts it into a formal Maintenance Work Order, assigns a certified field technician, and requisitions replacement spare parts.',
      stateLabel: 'STATUS: IN_PROGRESS',
      accent: 'border-blue-300 dark:border-blue-800',
    },
    {
      step: '04',
      title: 'Calibration, Costing & Return',
      actor: 'Certified Field Specialist',
      icon: CheckCheck,
      description:
        'Repairs are verified against calibration standards. Labor and spare parts are recorded with BigDecimal precision. Equipment status returns to AVAILABLE and audit logs seal the record.',
      stateLabel: 'RETURN TO SERVICE',
      accent: 'border-emerald-300 dark:border-emerald-800',
    },
  ];

  return (
    <section id="workflow" className="py-24 bg-card/40 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <Badge variant="lime" className="text-xs font-mono uppercase tracking-wider">
            Operational Lifecycle
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            From Fault Discovery to Certified Return to Service
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            How LabLedger replaces paper logbooks with automated safety guards, technician dispatches, and immutable compliance records.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-lg border border-border bg-card p-6 shadow-card flex flex-col justify-between relative space-y-4 hover:border-border transition-all"
              >
                <div className="space-y-3">
                  {/* Step number and badge */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-2xl font-black text-foreground/40">
                      {item.step}
                    </span>
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                      {item.actor}
                    </span>
                  </div>

                  <div className="w-10 h-10 rounded-md bg-muted/60 border border-border flex items-center justify-center text-foreground mt-2">
                    <Icon className="w-5 h-5 text-accent-lime" />
                  </div>

                  <h3 className="text-base font-bold text-foreground tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/60">
                  <span className="font-mono text-[10px] text-foreground font-semibold tracking-wide flex items-center justify-between">
                    <span>{item.stateLabel}</span>
                    {index < steps.length - 1 && (
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground hidden lg:block" />
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
