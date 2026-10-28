import React from 'react';
import { Wordmark } from '@/components/brand/Wordmark';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, GitBranch, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border bg-card/50 text-foreground transition-colors mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand & Purpose */}
          <div className="md:col-span-1 space-y-4">
            <Wordmark showTagline size="md" />
            <p className="text-xs text-muted-foreground leading-relaxed pt-2">
              Enterprise laboratory equipment reservation, scheduling conflict prevention, and lifecycle maintenance tracking built for university research facilities.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="lime" className="text-[10px]">
                PHASE 01 FOUNDATION
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                <GitBranch className="w-3 h-3" /> main
              </span>
            </div>
          </div>

          {/* Module Architecture */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground mb-4">
              Domain Modules
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Equipment Inventory &amp; Labs
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Conflict-Free Scheduling
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-foreground transition-colors">
                  Maintenance &amp; Work Orders
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  Audit History &amp; Compliance
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-foreground transition-colors">
                  MTBF &amp; Downtime Analytics
                </a>
              </li>
            </ul>
          </div>

          {/* Technical Specifications */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground mb-4">
              Core Engineering
            </h4>
            <ul className="space-y-2.5 text-xs text-muted-foreground font-mono">
              <li className="flex items-center gap-2">
                <Cpu className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                <span>Java 21 &bull; Spring Boot 3.5.x</span>
              </li>
              <li className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                <span>PostgreSQL 16 &bull; GiST Exclusion</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-accent-lime shrink-0" />
                <span>HttpOnly Sessions &bull; CSRF XSRF</span>
              </li>
              <li className="text-[11px] text-muted-foreground/80 pt-1">
                Zero JPA Entity Leakage &bull; Java Records
              </li>
            </ul>
          </div>

          {/* Project & University Links */}
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground mb-4">
              Documentation &amp; Source
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <a
                  href="https://github.com/Rohan23Nova/Lab-Equipment-Maintenance-Platform"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <span>GitHub Repository</span>
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-foreground transition-colors">
                  Architecture Specifications
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-foreground transition-colors">
                  Data Model &amp; ER Diagrams
                </a>
              </li>
              <li>
                <a href="#architecture" className="hover:text-foreground transition-colors">
                  Security &amp; RBAC Framework
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal / Editorial Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} LabLedger Platform. Designed for university research laboratories.
          </p>
          <p className="font-mono text-muted-foreground/80">
            Intervals modeled as <span className="text-foreground">[start, end)</span> &bull; UTC Normalized
          </p>
        </div>
      </div>
    </footer>
  );
};
