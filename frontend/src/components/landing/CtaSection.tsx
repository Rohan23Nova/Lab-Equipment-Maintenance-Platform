import React from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArrowRight, FileText, CheckCircle2 } from 'lucide-react';

export const CtaSection: React.FC = () => {
  const scrollToPreview = () => {
    document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-20 bg-muted/40 border-t border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <Badge variant="lime" className="text-xs font-mono uppercase tracking-wider">
          University Infrastructure Ready
        </Badge>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground max-w-2xl mx-auto">
          Modernize Your Academic Laboratory Operations.
        </h2>

        <p className="text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Say goodbye to fragmented booking spreadsheets and untracked machine downtime. Experience mathematical reservation reliability and full compliance traceability.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Button
            variant="primary"
            size="lg"
            onClick={scrollToPreview}
            className="gap-2 shadow-subtle"
          >
            <span>Explore Interactive Preview</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              window.open('https://github.com/Rohan23Nova/Lab-Equipment-Maintenance-Platform', '_blank');
            }}
            className="gap-2"
          >
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span>View Architecture Docs</span>
          </Button>
        </div>

        <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" /> Zero Cross-Module Database Joins
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" /> PostgreSQL GiST Overlap Defense
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-accent-lime" /> Testcontainers PostgreSQL Parity
          </span>
        </div>
      </div>
    </section>
  );
};
