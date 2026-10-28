import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { SystemStatus } from '@/types/api';
import { Activity } from 'lucide-react';

export const BackendStatusBadge: React.FC = () => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkStatus = async () => {
      try {
        const response = await apiClient.getSystemStatus();
        if (isMounted) {
          setStatus(response.data);
          setError(null);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Backend unreachable');
          setStatus(null);
          setLoading(false);
        }
      }
    };

    checkStatus();
    // Poll every 15 seconds
    const interval = setInterval(checkStatus, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border border-border bg-muted/40 text-muted-foreground">
        <Activity className="w-3 h-3 animate-pulse text-muted-foreground" />
        <span>Checking API...</span>
      </span>
    );
  }

  if (status && status.database.connected) {
    return (
      <span
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60"
        title={`Connected to ${status.application} with ${status.database.product}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>Spring &bull; PG Connected</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border border-amber-200/80 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60"
      title={error || 'Backend not currently running on port 8080'}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      <span>Backend Standby (:8080)</span>
    </span>
  );
};
