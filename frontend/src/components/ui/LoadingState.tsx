import React from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data from the laboratory ledger...',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <RefreshCw className="w-6 h-6 animate-spin text-accent-lime" aria-hidden="true" />
      <p className="text-sm font-medium">{message}</p>
      <span className="sr-only">Loading</span>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 5,
  cols = 5,
}) => {
  return (
    <div role="status" aria-label="Loading table content" className="w-full space-y-3 p-4 animate-pulse">
      <div className="h-9 bg-muted/60 rounded-md w-full mb-4" />
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} className="flex items-center gap-4 py-2 border-b border-border/40">
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className={`h-4 bg-muted/40 rounded ${
                cIdx === 0 ? 'w-1/4' : cIdx === 1 ? 'w-1/3' : 'w-1/6'
              }`}
            />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading rows...</span>
    </div>
  );
};
