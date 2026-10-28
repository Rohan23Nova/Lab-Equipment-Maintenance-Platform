import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, Terminal, CalendarClock, ShieldCheck, Microscope } from 'lucide-react';

export const Hero: React.FC = () => {
  const scrollToPreview = () => {
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToArchitecture = () => {
    document.getElementById('architecture')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Subtle background technical grid line (restrained, no glowing gradients) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Top Announcement Badge */}
        <div className="flex justify-start mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-card/60 backdrop-blur-sm text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-accent-lime" aria-hidden="true" />
            <span className="text-muted-foreground">Tagline:</span>
            <span className="font-semibold text-foreground tracking-tight">
              &ldquo;Every instrument accounted for.&rdquo;
            </span>
          </div>
        </div>

        {/* Main Headline & Supporting Text */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-sans font-bold tracking-tight text-foreground leading-[1.1]">
              University Laboratory Operations,{' '}
              <span className="relative inline-block text-foreground font-extrabold">
                Solved with Precision.
                <span
                  className="absolute bottom-1 left-0 w-full h-[3px] bg-accent-lime opacity-80"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl">
              Eliminate double-booked research bays, unmonitored equipment drift, and lost maintenance history.
              LabLedger delivers conflict-free scheduling backed by mathematical range constraints, operator certification checks, and complete lifecycle audit trails.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                onClick={scrollToPreview}
                className="gap-2.5 shadow-subtle group"
              >
                <span>Interactive Product Preview</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={scrollToArchitecture}
                className="gap-2"
              >
                <Terminal className="w-4 h-4 text-muted-foreground" />
                <span>Architecture Blueprint</span>
              </Button>
            </div>

            {/* Engineering Integrity Indicators */}
            <div className="pt-8 border-t border-border/70 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock className="w-4 h-4 text-accent-lime shrink-0" />
                <span>GiST Exclusion Locking</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck className="w-4 h-4 text-accent-lime shrink-0" />
                <span>HttpOnly CSRF Sessions</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground col-span-2 sm:col-span-1">
                <Microscope className="w-4 h-4 text-accent-lime shrink-0" />
                <span>Safety Certification Gate</span>
              </div>
            </div>
          </div>

          {/* Clean Editorial Status Summary Card */}
          <div className="lg:col-span-4">
            <div className="rounded-lg border border-border bg-card p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" aria-hidden="true" />
                  <span className="text-xs font-mono font-medium text-foreground">
                    FACILITY STATUS MONITOR
                  </span>
                </div>
                <Badge variant="lime" className="text-[10px]">
                  LIVE SYSTEM
                </Badge>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Active Laboratories</span>
                  <span className="font-semibold text-foreground font-tabular">14 Facilities</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Tracked Instruments</span>
                  <span className="font-semibold text-foreground font-tabular">342 Assets</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Conflict Collisions</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-tabular">
                    0 Overlaps (Guaranteed)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Active Work Orders</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400 font-tabular">
                    3 In Progress
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Time Interval Standard</span>
                  <span className="font-semibold text-foreground font-tabular">[start, end) UTC</span>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-muted-foreground leading-normal border-t border-border">
                Enforcing state-level data invariants across the academic semester.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
