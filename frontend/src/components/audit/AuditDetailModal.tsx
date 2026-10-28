import React from 'react';
import { Button } from '@/components/ui/Button';
import { AuditLogItem } from '@/types/audit';
import { AuditActionBadge } from '@/components/audit/AuditActionBadge';
import { AuditEntityTypeBadge } from '@/components/audit/AuditEntityTypeBadge';
import { X, ShieldCheck, User, Globe, Calendar, FileJson } from 'lucide-react';

interface AuditDetailModalProps {
  log: AuditLogItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  log,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !log) return null;

  const formattedDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return isoStr;
    }
  };

  let parsedDetails: any = null;
  if (log.detailsJson) {
    try {
      parsedDetails = JSON.parse(log.detailsJson);
    } catch {
      parsedDetails = log.detailsJson;
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
    >
      <div className="relative w-full max-w-2xl rounded-xl border border-border bg-card p-6 shadow-elevation-3 text-card-foreground max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-muted border border-border text-foreground">
              <ShieldCheck className="w-5 h-5 text-accent-lime" />
            </div>
            <div>
              <h2 id="audit-detail-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
                Audit Trail Entry
              </h2>
              <p className="text-xs font-mono text-muted-foreground">ID: {log.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="py-4 space-y-4 overflow-y-auto pr-1">
          {/* Action & Entity Type */}
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/70">
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Action
              </span>
              <AuditActionBadge action={log.action} />
            </div>
            <div className="h-8 w-px bg-border/60 mx-1 hidden sm:block" />
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">
                Target Entity
              </span>
              <div className="flex items-center gap-2">
                <AuditEntityTypeBadge entityType={log.entityType} />
                {log.entityIdentifier && (
                  <span className="font-mono text-xs font-bold text-primary">
                    {log.entityIdentifier}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Summary Narrative */}
          <div className="p-3.5 rounded-lg border border-border/80 bg-background/50 space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">
              Event Summary
            </span>
            <p className="text-sm font-medium text-foreground leading-relaxed">{log.summary}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Actor Information
              </span>
              <p className="font-semibold text-foreground">{log.actorName}</p>
              {log.actorEmail && <p className="text-muted-foreground">{log.actorEmail}</p>}
              {log.actorId && (
                <p className="font-mono text-[10px] text-muted-foreground/80">UID: {log.actorId}</p>
              )}
            </div>

            <div className="p-3 rounded-lg border border-border/80 bg-background/50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Execution Timestamp & IP
              </span>
              <p className="font-semibold text-foreground">{formattedDate(log.createdAt)}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Globe className="w-3 h-3" />
                <span className="font-mono">{log.ipAddress || 'Internal Dispatcher'}</span>
              </div>
            </div>
          </div>

          {/* Details JSON / Payload */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
              <FileJson className="w-3.5 h-3.5 text-accent-lime" />
              Sanitized Audit Payload (JSON)
            </span>
            <div className="rounded-lg border border-border bg-ink-950 p-3.5 font-mono text-xs text-zinc-200 overflow-x-auto shadow-inner max-h-60">
              {parsedDetails ? (
                <pre className="whitespace-pre-wrap break-all">
                  {typeof parsedDetails === 'object'
                    ? JSON.stringify(parsedDetails, null, 2)
                    : parsedDetails}
                </pre>
              ) : (
                <span className="text-zinc-500 italic">No structured delta recorded for this event.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border/80 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Cryptographically sealed and immutable audit record
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
