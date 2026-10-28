import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Database, Shield, Layers } from 'lucide-react';

export const ArchitectureHighlight: React.FC = () => {
  return (
    <section id="architecture" className="py-24 bg-background border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-3">
          <Badge variant="lime" className="text-xs font-mono uppercase tracking-wider">
            Technical Rigor
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Built for Longevity, Not Temporary Demos
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            LabLedger is engineered following strict enterprise Java architectural patterns, eliminating shortcuts, mock backends, or schema drift.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Modular Monolith */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-md bg-muted/60 border border-border flex items-center justify-center">
              <Layers className="w-5 h-5 text-accent-lime" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Modular Monolith Structure
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Decoupled domain modules under <code>com.labledger.modules.*</code>. Domain boundaries communicate via explicit service contracts and Spring <code>ApplicationEvent</code>s, with zero cross-module database joins.
            </p>
            <div className="pt-2 border-t border-border text-[11px] font-mono text-muted-foreground">
              Java 21 &bull; Spring Boot 3.5.x &bull; Immutable Records
            </div>
          </div>

          {/* Card 2: Database Integrity */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-md bg-muted/60 border border-border flex items-center justify-center">
              <Database className="w-5 h-5 text-accent-lime" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              PostgreSQL Exclusion Engine
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Schedule conflicts are locked both in memory and at the storage layer via <code>btree_gist</code> exclusion constraints on half-open ranges <code>[start, end)</code>. Managed strictly by versioned Flyway migrations.
            </p>
            <div className="pt-2 border-t border-border text-[11px] font-mono text-muted-foreground">
              Flyway Migrations &bull; ddl-auto: validate &bull; GiST Ranges
            </div>
          </div>

          {/* Card 3: Session Security */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card space-y-4">
            <div className="w-10 h-10 rounded-md bg-muted/60 border border-border flex items-center justify-center">
              <Shield className="w-5 h-5 text-accent-lime" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              HttpOnly Sessions &amp; CSRF
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Stateful server-side sessions with <code>SameSite=Strict</code> and <code>HttpOnly</code> cookies protect against token theft. Spring Security validates CSRF tokens via <code>X-XSRF-TOKEN</code> on every mutation.
            </p>
            <div className="pt-2 border-t border-border text-[11px] font-mono text-muted-foreground">
              BCrypt Cost 12 &bull; RFC 7807 &bull; Method RBAC
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
