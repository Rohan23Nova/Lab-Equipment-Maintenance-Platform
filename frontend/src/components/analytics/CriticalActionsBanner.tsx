import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CriticalActionItem } from '@/types/analytics';
import { AlertTriangle, Clock, AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface CriticalActionsBannerProps {
  items: CriticalActionItem[];
}

export const CriticalActionsBanner: React.FC<CriticalActionsBannerProps> = ({ items }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return null;
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'CRITICAL_FAULT':
        return <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'OVERDUE_WORK_ORDER':
        return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'PENDING_APPROVAL':
      default:
        return <Clock className="w-4 h-4 text-accent-lime shrink-0" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'WARNING':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border/80';
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/30 bg-card p-4 sm:p-5 shadow-elevation-1 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Critical Action Queue ({items.length})
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">Immediate triage recommended</span>
      </div>

      <div className="divide-y divide-border/40 space-y-2 pt-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5">{getActionIcon(item.actionType)}</div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{item.title}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded uppercase border font-bold ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(item.targetUrl)}
              className="self-end sm:self-center h-8 text-xs gap-1.5 shrink-0"
            >
              <span>Resolve</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
