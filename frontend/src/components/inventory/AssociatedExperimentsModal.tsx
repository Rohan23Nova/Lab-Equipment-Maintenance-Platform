import React, { useState, useEffect } from 'react';
import { TeachingExperimentSummary } from '@/types/inventory';
import { inventoryApi } from '@/lib/inventoryApi';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { X, BookOpen, FlaskConical, Wrench, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AssociatedExperimentsModalProps {
  isOpen: boolean;
  laboratoryId: string;
  laboratoryName: string;
  laboratoryCode: string;
  onClose: () => void;
}

export const AssociatedExperimentsModal: React.FC<AssociatedExperimentsModalProps> = ({
  isOpen,
  laboratoryId,
  laboratoryName,
  laboratoryCode,
  onClose,
}) => {
  const [experiments, setExperiments] = useState<TeachingExperimentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !laboratoryId) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    inventoryApi
      .getExperimentsByLaboratory(laboratoryId)
      .then((data) => {
        if (isMounted) setExperiments(data);
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load laboratory experiments:', err);
          setError('Could not load curriculum practical experiments.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, laboratoryId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-card border border-border shadow-lg rounded-xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-labelledby="experiments-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-lime/10 border border-accent-lime/20 flex items-center justify-center text-accent-lime">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border">
                  {laboratoryCode}
                </span>
                <h3 id="experiments-modal-title" className="text-base font-bold text-foreground">
                  Curriculum Teaching Experiments
                </h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{laboratoryName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" />
              <p className="text-xs font-medium">Loading syllabus practical experiments...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs">{error}</p>
            </div>
          ) : experiments.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-xs">
              No formal teaching experiments currently linked to this facility.
            </div>
          ) : (
            <div className="space-y-3">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  className="p-4 rounded-lg border border-border/80 bg-background hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-muted text-foreground border border-border">
                      {exp.code}
                    </span>
                    <Badge variant="neutral" className="text-[10px]">
                      {exp.subject}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-semibold text-foreground leading-snug">
                    {exp.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    <strong className="text-foreground">Objective:</strong> {exp.objective}
                  </p>
                  <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Wrench className="w-3.5 h-3.5 text-accent-lime" />
                      {exp.equipmentCount} instrument{exp.equipmentCount === 1 ? '' : 's'} required
                    </span>
                    {exp.manualReference && (
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <BookOpen className="w-3 h-3 text-muted-foreground" />
                        {exp.manualReference}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border bg-muted/20 flex items-center justify-between">
          <Link
            to={`/app/equipment?laboratoryId=${laboratoryId}`}
            onClick={onClose}
            className="text-xs font-semibold text-primary hover:underline"
          >
            View All Lab Instruments &rarr;
          </Link>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
