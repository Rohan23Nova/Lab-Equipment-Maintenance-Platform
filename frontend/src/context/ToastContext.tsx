import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ type, title, message, duration = 4500 }: Omit<Toast, 'id'>) => {
      const id = 'toast-' + Math.random().toString(36).substring(2, 9);
      const newToast: Toast = { id, type, title, message, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }

      return id;
    },
    [dismissToast]
  );

  const success = useCallback(
    (message: string, title?: string) => showToast({ type: 'success', message, title }),
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'error', message, title, duration: 6000 }),
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string) => showToast({ type: 'warning', message, title }),
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string) => showToast({ type: 'info', message, title }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        success,
        error,
        warning,
        info,
        dismissToast,
      }}
    >
      {children}
      {/* Accessible Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
        role="region"
        aria-label="Notifications queue"
      >
        {toasts.map((toast) => {
          const typeStyles: Record<
            ToastType,
            { border: string; bg: string; icon: React.ReactNode; text: string }
          > = {
            success: {
              border: 'border-emerald-500/40 dark:border-emerald-500/50',
              bg: 'bg-card text-foreground',
              icon: <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />,
              text: 'text-emerald-600 dark:text-emerald-400',
            },
            error: {
              border: 'border-rose-500/40 dark:border-rose-500/50',
              bg: 'bg-card text-foreground',
              icon: <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />,
              text: 'text-rose-600 dark:text-rose-400',
            },
            warning: {
              border: 'border-amber-500/40 dark:border-amber-500/50',
              bg: 'bg-card text-foreground',
              icon: <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />,
              text: 'text-amber-600 dark:text-amber-400',
            },
            info: {
              border: 'border-blue-500/40 dark:border-blue-500/50',
              bg: 'bg-card text-foreground',
              icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />,
              text: 'text-blue-600 dark:text-blue-400',
            },
          };

          const style = typeStyles[toast.type];

          return (
            <div
              key={toast.id}
              role={toast.type === 'error' ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg ${style.border} ${style.bg} transition-all duration-200 animate-in fade-in slide-in-from-bottom-2`}
            >
              <div className="pt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-sm font-medium leading-relaxed">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    // Graceful fallback if invoked outside ToastProvider
    return {
      toasts: [],
      showToast: () => '',
      success: () => '',
      error: () => '',
      warning: () => '',
      info: () => '',
      dismissToast: () => {},
    };
  }
  return context;
};
